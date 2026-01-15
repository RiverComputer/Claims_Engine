# Prototype v3 — Force Layout "Visual Ecology" Architecture

## Overview

Prototype v3 replaces manual/static node positioning with a physics-based, form-finding graph layout using d3-force, while keeping React Flow as the renderer/editor. The graph behaves like a visual ecology where evidence nodes distribute around validation nodes, validation nodes sit between evidence and claims, and a single root claim-of-claims node keeps the whole graph coherent.

## Architecture Summary

### Core Components

1. **Force Layout Engine** (`lib/layout/force-layout-v3.ts`)
   - Pure d3-force layout engine
   - Maps React Flow nodes/edges to simulation nodes/links
   - Configures forces: collision, links, repulsion, layering, centering
   - Syncs simulation positions back to React Flow

2. **React Hook** (`hooks/useForceLayout.ts`)
   - Integrates d3-force simulation with React Flow
   - Manages simulation lifecycle (create, update, destroy)
   - Throttles updates to ~60fps to avoid React thrash
   - Provides controls: reheat, pause, resume, stabilize, pin/unpin

3. **Root Node Management** (`lib/graph/root-node.ts`)
   - Auto-creates and maintains one root node per project
   - Generates invisible root links to all claim nodes
   - Ensures graph coherence through weak gravity forces

4. **Physics Controls** (`components/PhysicsControls.tsx`)
   - UI panel with Play/Pause, Reheat, Stabilize buttons
   - Shows simulation running state

5. **FlowCanvas Integration** (`components/canvas/FlowCanvas.tsx`)
   - Accepts drag handlers: `onNodeDragStart`, `onNodeDrag`, `onNodeDragStop`
   - Passes drag events to force layout for pinning

6. **Project Page** (`app/projects/[id]/page.tsx`)
   - Manages root node lifecycle (ensure exists, create in DB if needed)
   - Integrates force layout hook
   - Handles drag events to pin/unpin nodes
   - Saves positions to DB on drag end

## How Simulation Syncs with React Flow

1. **Initialization**: When `useForceLayout` hook is enabled:
   - Maps React Flow nodes → SimNodes (preserves existing positions)
   - Maps React Flow edges → SimLinks (includes invisible root links)
   - Creates d3-force simulation with configured forces

2. **Tick Updates**: On each simulation tick:
   - Updates are throttled to ~60fps (16ms) to avoid React thrash
   - Uses `requestAnimationFrame` to batch React state updates
   - Calls `onTick` callback with updated node positions
   - Parent component updates React Flow nodes via `setNodes`

3. **Position Preservation**: 
   - On initial load, uses positions from database
   - During simulation, positions are continuously updated
   - On drag, node is pinned (fx/fy set) and unpinned on release
   - On drag end, position is saved to database

## Performance Strategy

1. **Throttling**: Updates throttled to 16ms (~60fps) to prevent React re-render thrash
2. **Memoization**: Graph signature (node IDs + edge IDs) used to detect changes
3. **Position Preservation**: Existing simulation positions preserved when graph updates
4. **RequestAnimationFrame**: Batches React state updates to avoid blocking
5. **Simulation Reuse**: Updates existing simulation instead of recreating when possible

## Tuning Parameters

Current values in `DEFAULT_CONFIG`:

### Collision
- `collisionPadding`: 12
- `collisionIterations`: 2

### Link Forces
- Evidence → Validation: distance 80, strength 0.9
- Validation → Claim: distance 140, strength 0.7
- Evidence → Claim: distance 220, strength 0.2
- Root → Claim: distance 180, strength 0.12

### Repulsion (Charge)
- Evidence: -250
- Validation: -120
- Claim: -80
- Root: -20

### Layering (Vertical Stratification)
- Strength: 0.08
- Evidence target Y: +200
- Validation target Y: 0
- Claim target Y: -200
- Root target Y: -320

### Simulation
- `alphaDecay`: 0.0228 (~2-10 seconds to settle)
- `alphaTarget`: 0
- `velocityDecay`: 0.4

## Known Limitations / Next Improvements

1. **Large Graph Performance**: 
   - Current implementation works well for ~100-300 nodes
   - For larger graphs, consider:
     - Spatial indexing (quadtree) for collision detection
     - Level-of-detail rendering
     - Web Workers for simulation computation

2. **Viewport-Aware Centering**:
   - Currently centers at (0, 0) in simulation coordinates
   - Could be improved to center based on viewport bounds

3. **Clustering Heuristics**:
   - Evidence nodes cluster around validations they connect to
   - Could add explicit clustering force for better grouping

4. **Root Node Persistence**:
   - Root node is created in-memory if missing
   - Should be automatically persisted to database on project load

5. **Edge Visibility**:
   - Root links are invisible (opacity: 0)
   - Could add toggle to show/hide root links for debugging

6. **Layout Persistence**:
   - Positions saved to DB on drag end
   - Could add periodic auto-save during simulation

7. **Initial Layout**:
   - Uses database positions if available
   - Could add smart initial placement for new nodes

## Success Criteria Status

✅ **No overlap**: Collision force with padding prevents stacked nodes  
✅ **Stable equilibrium**: Alpha decay configured for ~2-10 second settle time  
✅ **Type-aware structure**: Layering forces create vertical stratification  
✅ **Drag interaction**: Nodes pin during drag, release on stop  
✅ **Reheat/Pause controls**: PhysicsControls component provides all controls  
✅ **Graph coherence**: Root node with weak links keeps claims connected  
✅ **Performance**: Throttled updates ensure smooth ~60fps rendering  

## File Structure

```
prototype2/
├── lib/
│   ├── layout/
│   │   └── force-layout-v3.ts      # Core force layout engine
│   └── graph/
│       └── root-node.ts            # Root node management
├── hooks/
│   └── useForceLayout.ts            # React hook integration
├── components/
│   ├── canvas/
│   │   ├── FlowCanvas.tsx           # React Flow canvas (updated)
│   │   └── NodeTypes.tsx            # Includes RootClaimNode
│   └── PhysicsControls.tsx          # Physics control UI
└── app/
    └── projects/
        └── [id]/
            └── page.tsx             # Project page (integrated)
```

## Testing Checklist

- [x] Load project with 30+ nodes → nodes spread without overlap
- [x] Add evidence node + connect to validation → evidence snaps into cluster
- [x] Add new claim node → validation cluster shifts upward; root holds claims
- [x] Drag node → pins smoothly; release → re-integrates
- [x] Press Reheat → graph re-settles
- [x] Pause → nodes stop moving; play → movement resumes
- [x] Commit nodes → immutability respected (layout can move unless pinned)

