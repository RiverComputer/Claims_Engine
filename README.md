# Claims Engine Prototype v2

A React Flow-based graph interface for building Claims Engine structures incrementally. Users create Evidence, Validation, and Claim nodes in a DAG, connect them with edges, fill fields via an inspector panel, and commit nodes to generate deterministic content identifiers.

## Features

- **Graph Canvas**: React Flow-based interface for visual claim construction
- **Node Types**: Evidence, Validation, and Claim nodes with distinct visual styles
- **Edge Rules**: Enforced connection rules (Evidence→Validation, Validation→Claim, etc.)
- **Inspector Panel**: Side panel for editing node fields
- **Commit System**: Mock adapter generates deterministic CIDs and attestation UIDs
- **Project Workspaces**: Multiple projects, each containing a graph of nodes and edges
- **Commit Immutability**: Committed nodes lock connected edges and become immutable

## Architecture

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS, React Flow
- **Database**: SQLite with Prisma ORM
- **Validation**: Zod schemas for node payloads
- **CID Generation**: Deterministic SHA-256 hashing of canonicalized JSON

## Getting Started

1. Install dependencies:
```bash
cd prototype2
npm install
```

2. Set up the database:
```bash
npm run db:migrate
npm run db:generate
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Prototype 3 branch

Work on prototype 3 in the `prototype3` branch and run:
```bash
npm run dev:prototype3
```

This keeps `main` stable for collaborators while you iterate on prototype 3.

## Seeding Obuntu pilot data

Use the shared Obuntu pilot bundle to populate the graphs without local data.

1. Set the data URL (expects a downloadable `.zip` that contains a `raw-data/` folder):
```bash
export OBUNTU_PILOT_URL="https://drive.google.com/uc?export=download&id=FILE_ID"
```

2. Run the seed script:
```bash
npm run seed:obuntu
```

The seed script downloads the archive, extracts it under `.cache/obuntu-pilot-project/`, then runs the import scripts. You can also override the data root for imports by setting `PILOT_PROJECT_DIR` in your environment.

## Usage

1. Create a new project from the home page
2. Add nodes using the palette (Evidence, Validation, Claim)
3. Connect nodes by dragging from source to target
4. Select a node to edit its fields in the inspector panel
5. Commit nodes when ready (generates CID and attestation UID)
6. Use the Mint button (stub) for future onchain anchoring

## Node Lifecycle

- **Draft**: Editable, no CID, can be modified and connected
- **Committed**: Immutable, has CID + attestation UID, locks connected edges

## Edge Rules

**Allowed**:
- Evidence → Validation
- Validation → Claim
- Evidence → Claim
- Validation → Evidence (evidence-of-validation)

**Disallowed**:
- Claim → Evidence
- Claim → Claim

## Commit Gating

- **Evidence**: Required fields only (title, content)
- **Validation**: ≥1 Evidence reference + required fields
- **Claim**: ≥1 Evidence + ≥1 Validation reference + required fields

## Known Limitations

- Mock adapter only (IPFS/EAS adapters not yet implemented)
- Export panel is placeholder
- Mint modal is stub (no actual minting)
- No authentication (uses "guest" user)
- Layout persistence could be optimized

