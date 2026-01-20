# Obuntu Resets Document Taxonomy & Claims Ontology
## Pilot Project: Community Resilience & Wetland Stewardship

**Purpose:** Structured ontology for parsing documents into a Claims Engine graph where artifacts are classified by their *role in restoring relations*, not by file format alone.

**Core Principle:** *"Documents have types, but claims have roles."*

A `.docx` file could be:
- **Evidence** of what was said
- **Meta-evidence** of agreement/validation
- A **Claim source** for synthesized insight
- A **Governance act** (decision evidence)

This taxonomy classifies each artifact by *what it does in the relational system*.

---

## 1. Ontology Dimensions (Tagging Schema)

Each document (or cluster of documents) is assigned tags across **three required dimensions**:

| Dimension | Purpose | Cardinality |
|-----------|---------|-------------|
| **Root Claim Category** | What type of relational work does this evidence? | Exactly 1 |
| **Obuntu Pathway** | Which restoration pathway(s) does this support? | 0..n (recommended) |
| **Claims Engine Function** | What node type does this artifact support? | Exactly 1 |

---

## 2. Root Claim Categories

### 2.1 Knowledge Gathering (`KG__`)

**Definition:** Artifacts that describe conditions, diagnose problems, map relations, capture perspectives, and establish state-of-situation.

**Claim-bearing intent:** *"What's true about the situation and why it matters."*

**Typical artifacts:**
- Community mapping outputs (PDF maps, KMZ, mapping reports)
- FGD and KII transcripts
- Field data reports
- One-on-one landowner interviews
- Technical reports (GIS, hydrology, pollution)
- "Stories of place" documents (when primarily descriptive/diagnostic)

**Example claims:**
- *"Wetland pollution hotspots were identified and georeferenced."*
- *"Landowner interviews surfaced primary barriers to recommoning land: mistrust + fear of fraud + unclear legal protections."*
- *"Water quality testing revealed elevated phosphate levels at 3 drainage entry points."*

---

### 2.2 Kinship Gathering (`KNG__`)

**Definition:** Artifacts that evidence people gathering to build trust, shared identity, and shared will—often includes ritual, ceremony, attendance, and emotional shifts.

**Claim-bearing intent:** *"We gathered; trust and collective will moved."*

**Typical artifacts:**
- Conference notes and reflections
- Meeting minutes oriented toward community alignment
- Attendance lists (as meta-evidence)
- Photos/videos of gatherings (as references)
- Written fears/visions/solutions
- Community stories (when primarily identity/collective narrative formation)

**Example claims:**
- *"Skepticism softened into participation through transparent dialogue and bilingual facilitation."*
- *"A shared 'love of place' memory (1990s collective infrastructure building) was activated as a driver of renewed collective will."*
- *"17 households who had not spoken in 3 years participated together in the dialogue circle."*

---

### 2.3 Governance Gatherings (`GG__`)

**Definition:** Artifacts evidencing structured decision-making, roles, mandates, voting, bylaws, committees, and permissions.

**Claim-bearing intent:** *"Authority formed; decisions were made using a process."*

**Typical artifacts:**
- Bylaws drafts and ratifications
- Nomination lists / organizing committee lists
- Voting outcomes
- Governance procedure documents
- Committee meeting minutes where decisions are made

**Example claims:**
- *"A 19-person organizing committee was formed with representation across age, gender, and landscape zones."*
- *"Bylaw reading established procedural legitimacy for collective action."*
- *"Community voted to establish a shared maintenance fund with monthly contributions."*

---

### 2.4 Intervention (`INT__`)

**Definition:** Artifacts evidencing material action taken in the world—cleanup, restoration, infrastructure, trainings, implementation, enforcement.

**Claim-bearing intent:** *"Conditions changed due to action."*

**Typical artifacts:**
- Cleanup logs, activity reports
- Restoration documentation
- Construction/repair records
- Training completion lists
- Before/after documentation
- Procurement/resource distribution records

**Example claims:**
- *"Waste removal actions reduced blockages in X drainage points (with before/after evidence)."*
- *"Training created operational capacity: N participants completed composting steward training."*
- *"Buffer zone planting established 200m of vegetated riparian corridor."*

---

## 3. Obuntu Relational Pathways

These are **cross-cutting tags**—a document can have multiple pathways. They bind evidence and claims to the Resets framework for community healing.

### 3.1 Re-Trusting (`RT__`) — *Obwesigwa*

**Focus:** Trust rebuilding, rumor dissolution, transparency rituals, conflict resolution

**Indicators in documents:**
- Language about suspicion, mistrust, or past conflicts
- Descriptions of transparency practices
- Evidence of formerly-estranged parties gathering
- Facilitation notes about emotional shifts

**Example evidence:** Neighbourhood dialogue minutes where long-standing disputes were surfaced and addressed

---

### 3.2 Re-Stewarding (`RS__`) — *Obuwanika*

**Focus:** Stewardship practice, skill-building, ecological care, knowledge transfer

**Indicators in documents:**
- Training content or completion records
- Technical knowledge about wetland/land management
- Skill-sharing documentation
- Stewardship practice descriptions

**Example evidence:** FGD transcripts discussing traditional water management practices

---

### 3.3 Re-Landing (`RL__`) — *Obutaka*

**Focus:** Belonging, authority, duty, recommoning land, covenants, boundary clarification

**Indicators in documents:**
- Discussions of land rights, ownership, boundaries
- Commons governance formation
- Duty/responsibility assignments
- Covenant or agreement language

**Example evidence:** Bylaws establishing collective land stewardship responsibilities

---

### 3.4 Re-Naturing (`RN__`) — *Obutonde*

**Focus:** Ecological restoration, wetland/forest regeneration, species recovery

**Indicators in documents:**
- Environmental condition assessments
- Restoration plans or documentation
- Flora/fauna observations
- Pollution remediation records

**Example evidence:** Field data reports documenting wetland vegetation recovery

---

### 3.5 Re-Generating (`RG__`) — *Enkulakulaana eyo'kuntikko*

**Focus:** Sustained capability, institutions, funding, enterprise, long-term resilience

**Indicators in documents:**
- Institutional formation documents
- Funding/resource allocation
- Sustainability planning
- Enterprise or livelihood development

**Example evidence:** Committee formation minutes establishing ongoing governance structure

---

## 4. Claims Engine Functions

Each artifact needs a **claims-engine role** defining what node type it supports in the graph.

### 4.1 Evidence (`evidence`)

**Definition:** Raw observations, records, and artifacts capturing what happened or what was observed.

**Characteristics:**
- Primary source material
- Captures direct observation, testimony, or measurement
- Forms the foundation for claims

**Examples:** FGD transcripts, field data reports, photos, audio recordings, community maps

---

### 4.2 Validation (`validation`)

**Definition:** A record whose purpose is agreement, verification, or endorsement—describing *how* we know or *how* we agreed.

**Characteristics:**
- Explains the verification process
- May include signatures, votes, or formal endorsement
- Can be low-tech (witnessed agreement) or high-tech (cryptographic attestation)

**Examples:** Signed bylaws, voting records, methodology guides, verification protocols

---

### 4.3 Meta-Evidence of Validation (`meta_evidence_of_validation`)

**Definition:** Evidence that a validation event or process occurred—proof that people agreed.

**Characteristics:**
- Documents the fact that validation happened
- Does not itself contain the validated content
- Supports the legitimacy of validation claims

**Examples:** Attendance lists, photos of signing ceremonies, WhatsApp confirmation screenshots, minutes documenting a vote

---

### 4.4 Claim Source (`claim_source`)

**Definition:** A document that is already a synthesis and can be used to draft a Claim node—but still needs anchoring to underlying evidence where possible.

**Characteristics:**
- Contains interpreted/synthesized content
- Often produced by facilitators, researchers, or committees
- May combine multiple evidence sources
- Requires back-linking to underlying evidence for full validity

**Examples:** Conference reports, summary memos, technical mapping reports, dissemination documents

---

## 5. The Validation–Attestation Collapse Rule

**Critical principle:** Validation exists in two layers simultaneously:

1. **The mechanism:** signing, attesting (cryptographic or social)
2. **The content:** an explanation of how we know / how we agreed

### Operational Rules

| If a document is... | Classify as... |
|---------------------|----------------|
| Proof that people agreed (attendance list, photo of ceremony) | `meta_evidence_of_validation` |
| A statement describing how agreement/verification happened | `validation` |
| Already high-level synthesis of validation | `claim_source` |

### Coexistence Principle

Both **low-tech** (WhatsApp screenshot, handwritten minutes, witnessed signatures) and **high-tech** (EAS attestations, schema conformance checks) validation methods are equally valid in the ontology. The taxonomy must support both without privileging either.

### Graph Implications

```
Claim Node
    │
    ├── supported_by → Evidence Node(s)
    │
    └── validated_by → Validation Node
                           │
                           └── evidenced_by → Meta-Evidence Node(s)
```

---

## 6. Document Type → Ontology Mapping

### 6.1 Meeting Minutes & Dialogues

| Subtype | Primary Category | Function | Typical Pathways |
|---------|------------------|----------|------------------|
| Neighbourhood dialogue minutes | `KNG__` Kinship | `evidence` | `RT__` re_trusting |
| Committee minutes with decisions | `GG__` Governance | `validation` | `RL__` re_landing, `RG__` re_generating |
| Activity reflection minutes | `KNG__` Kinship | `evidence`, `claim_source` | `RT__` re_trusting, `RS__` re_stewarding |
| Inception/planning minutes | `GG__` Governance | `evidence` | `RG__` re_generating |

**File patterns:**
- `[NEIGHBOURHOOD NAME] [meeting/dialogue].docx`
- `MINUTES FOR [EVENT] [DATE].docx`
- `Minutes_ [Event Name].docx`

---

### 6.2 Attendance & Participation Records

| Subtype | Primary Category | Function | Typical Pathways |
|---------|------------------|----------|------------------|
| Conference attendance lists | `KNG__` Kinship | `meta_evidence_of_validation` | `RT__` re_trusting |
| Committee meeting attendance | `GG__` Governance | `meta_evidence_of_validation` | `RL__` re_landing |
| Training participant lists | `INT__` Intervention | `meta_evidence_of_validation` | `RS__` re_stewarding |

**File patterns:**
- `[event] attendance list.xlsx`
- `LIST OF PARTICIPANTS.docx`
- `scanned attendance list.pdf`

---

### 6.3 FGD & KII Transcripts

| Subtype | Primary Category | Function | Typical Pathways |
|---------|------------------|----------|------------------|
| FGD transcripts (women-only) | `KG__` Knowledge | `evidence` | `RS__` re_stewarding, `RT__` re_trusting |
| FGD transcripts (mixed) | `KG__` Knowledge | `evidence` | `RS__` re_stewarding |
| KII transcripts | `KG__` Knowledge | `evidence` | `RS__` re_stewarding, `RL__` re_landing |
| Research methodology guides | `KG__` Knowledge | `validation` | — |

**File patterns:**
- `FGD [number]_ [description] [zone].docx`
- `KII [number]_ [description] [zone].docx`
- `KII-[number] [Zone name].docx`

**Geographic organization:**
- `FGD+KII TRANSCRIPTS/BALINTUMA ZONE/`
- `FGD+KII TRANSCRIPTS/KIGOOWA/`
- `FGD+KII TRANSCRIPTS/KIWATULE CENTRAL/`

---

### 6.4 One-on-One Landowner Interviews

| Subtype | Primary Category | Function | Typical Pathways |
|---------|------------------|----------|------------------|
| Interview transcripts | `KG__` Knowledge | `evidence` | `RL__` re_landing, `RS__` re_stewarding |
| Interview audio recordings | `KG__` Knowledge | `evidence` | `RL__` re_landing |

**File patterns:**
- `One on one minutes.docx`
- `one on one with [Name].m4a`

---

### 6.5 Field Data Reports & Technical Documents

| Subtype | Primary Category | Function | Typical Pathways |
|---------|------------------|----------|------------------|
| Field data reports | `KG__` Knowledge | `evidence`, `claim_source` | `RS__` re_stewarding, `RN__` re_naturing |
| Technical mapping reports | `KG__` Knowledge | `claim_source` | `RS__` re_stewarding, `RN__` re_naturing |
| Environmental assessments | `KG__` Knowledge | `evidence` | `RN__` re_naturing |

**File patterns:**
- `[Location] field data report.pdf`
- `Technical Mapping Report [Organization].docx`

---

### 6.6 Community Maps

| Subtype | Primary Category | Function | Typical Pathways |
|---------|------------------|----------|------------------|
| Community-drawn maps | `KG__` Knowledge | `evidence` | `RS__` re_stewarding, `RL__` re_landing |
| Final/consolidated maps | `KG__` Knowledge | `claim_source` | `RS__` re_stewarding, `RL__` re_landing |
| GIS/technical maps | `KG__` Knowledge | `evidence` | `RS__` re_stewarding, `RN__` re_naturing |

**File patterns:**
- `[Location]_Community_Final_Map.pdf`
- `google-earth-community-mapping.kmz`
- `[Location] Community Map.mpkx`

---

### 6.7 Bylaws & Governance Documents

| Subtype | Primary Category | Function | Typical Pathways |
|---------|------------------|----------|------------------|
| Bylaw drafts | `GG__` Governance | `evidence` | `RL__` re_landing, `RG__` re_generating |
| Ratified bylaws | `GG__` Governance | `validation` | `RL__` re_landing, `RG__` re_generating |
| Committee nominations | `GG__` Governance | `validation` | `RL__` re_landing |
| Inaugural reading minutes | `GG__` Governance | `meta_evidence_of_validation` | `RL__` re_landing, `RT__` re_trusting |

**File patterns:**
- `MINUTES FOR THE INAUGURAL READING OF THE BYLAWS [LOCATION] [DATE].docx`
- `Minutes_ Inaugural Meeting of the NVC Organizing Committee.docx`

---

### 6.8 Conference Reports & Event Reflections

| Subtype | Primary Category | Function | Typical Pathways |
|---------|------------------|----------|------------------|
| Conference reports | `KNG__` Kinship | `claim_source` | `RT__` re_trusting, `RL__` re_landing |
| Event reflection notes | `KNG__` Kinship | `evidence`, `claim_source` | `RT__` re_trusting |
| Dissemination meeting minutes | `KG__` Knowledge | `claim_source` | `RS__` re_stewarding |

**File patterns:**
- `The Conference of Landstewards-Report_.docx`
- `MEETING MINUTES FOR A DISSEMINATION MEETING.docx`

---

### 6.9 Narrative & Vision Documents

| Subtype | Primary Category | Function | Typical Pathways |
|---------|------------------|----------|------------------|
| Community stories (diagnostic) | `KG__` Knowledge | `evidence` | `RS__` re_stewarding, `RT__` re_trusting |
| Community stories (identity) | `KNG__` Kinship | `evidence`, `claim_source` | `RT__` re_trusting, `RL__` re_landing |
| Written fears | `KNG__` Kinship | `evidence` | `RT__` re_trusting |
| Written visions | `KNG__` Kinship | `evidence` | `RG__` re_generating, `RN__` re_naturing |
| Written solutions | `KNG__` Kinship | `evidence` | `RS__` re_stewarding, `RG__` re_generating |

**File locations:**
- `Conference of Landstewards/writen fears & visions/`
- `written visions fears solutions_/`
- `Stories of Kiwaatule Valley.docx`

---

### 6.10 Stakeholder Engagement Documents

| Subtype | Primary Category | Function | Typical Pathways |
|---------|------------------|----------|------------------|
| Stakeholder tour documentation | `KG__` Knowledge | `evidence` | `RS__` re_stewarding |
| External stakeholder perspectives | `KG__` Knowledge | `evidence` | `RG__` re_generating |

**File patterns:**
- `A tour of [Location] Wetland.docx`

---

### 6.11 Intervention Documentation

| Subtype | Primary Category | Function | Typical Pathways |
|---------|------------------|----------|------------------|
| Cleanup/restoration logs | `INT__` Intervention | `evidence` | `RN__` re_naturing |
| Before/after photos | `INT__` Intervention | `evidence` | `RN__` re_naturing |
| Training completion records | `INT__` Intervention | `validation` | `RS__` re_stewarding |
| Resource distribution records | `INT__` Intervention | `evidence` | `RG__` re_generating |

---

## 7. Canonical Claim Templates

Claims should be framed as **learnings, consequences, or shifts in capacity**—not merely "events occurred."

### 7.1 Knowledge Gathering Claim Templates

```
"[Condition/Problem] was identified and [documented/georeferenced/quantified]."

"[Research method] surfaced [finding]: [specific barriers/enablers/conditions]."

"[Number] [units] of [measurement type] were [observed/recorded/documented] at [location]."

"Historical analysis revealed [pattern/trend] in [domain] over [time period]."
```

**Examples from corpus:**
- *"Community mapping identified 7 pollution hotspots along the wetland perimeter."*
- *"KII interviews revealed that 4 of 6 key informants cited unclear land tenure as the primary barrier to collective action."*
- *"Field data reports documented 40% reduction in water flow at drainage point B3 compared to 2020 baseline."*

---

### 7.2 Kinship Gathering Claim Templates

```
"[Barrier to trust] was addressed through [process], resulting in [evidence of trust shift]."

"A shared [memory/identity/value] was [surfaced/activated/strengthened] as a driver of [collective action type]."

"[Number] [stakeholder types] who had [prior relationship barrier] participated together in [activity]."

"Collective will shifted from [prior state] to [new state] as evidenced by [observable change]."
```

**Examples from corpus:**
- *"Neighbourhood dialogues shifted participation from 12 to 47 households over 3 sessions."*
- *"The Conference of Landstewards surfaced a shared 'love of place' narrative rooted in 1990s collective well-digging."*
- *"Written fears exercises revealed flooding and land-grabbing as the two dominant anxieties across all neighbourhoods."*

---

### 7.3 Governance Gathering Claim Templates

```
"[Governance body] was formed with [composition/representation details]."

"[Decision] was made using [process] with [participation/validation evidence]."

"[Authority/mandate] was established through [legitimation process]."

"[Role/responsibility] was assigned to [party] with [accountability mechanism]."
```

**Examples from corpus:**
- *"A 19-person organizing committee was formed with representation across 7 neighbourhoods, 3 zones, and balanced gender composition."*
- *"Bylaw Article 7 (maintenance fund) was ratified with 94% approval from attending landowners."*
- *"The NVC Organizing Committee was mandated to coordinate restoration activities with quarterly reporting requirements."*

---

### 7.4 Intervention Claim Templates

```
"[Action] resulted in [measurable outcome] at [location]."

"[Number] [participants] completed [training/activity], creating [capacity type]."

"[Before condition] changed to [after condition] as evidenced by [documentation type]."

"[Resource type] was [distributed/deployed] to [recipients/locations] for [purpose]."
```

**Examples from corpus:**
- *"Drainage clearing at point B3 restored 80% of historical water flow (pre/post measurement documentation)."*
- *"23 community members completed composting steward training with demonstrated competency."*
- *"Buffer zone planting established 200m of vegetated riparian corridor (before/after photo documentation)."*

---

## 8. Document Metadata Schema

### 8.1 Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `artifact_id` | string | Unique identifier (auto-generated or assigned) |
| `source_file` | string | Original filename |
| `source_format` | enum | `.docx`, `.pdf`, `.xlsx`, `.kmz`, `.m4a`, `.mp4`, `.jpg`, etc. |
| `primary_claim_category` | enum | `KG__`, `KNG__`, `GG__`, `INT__` |
| `function` | enum | `evidence`, `validation`, `meta_evidence_of_validation`, `claim_source` |
| `geo_scope` | enum | `project`, `neighbourhood`, `zone`, `site` |

### 8.2 Recommended Fields

| Field | Type | Description |
|-------|------|-------------|
| `pathways` | array[enum] | `RT__`, `RS__`, `RL__`, `RN__`, `RG__` (0..n) |
| `event_name` | string | Associated event if applicable |
| `date` | date | Date of artifact creation or event |
| `location` | string | Specific location referenced |
| `participants` | array[string] | Named participants if applicable |

### 8.3 Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `linked_evidence` | array[artifact_id] | For claim_source: underlying evidence |
| `linked_validation` | artifact_id | For claims: validation record |
| `language` | string | Primary language of document |
| `transcription_status` | enum | `original`, `transcribed`, `translated` |
| `notes` | string | Free text annotation |

---

## 9. Claims Engine Graph Structure

### 9.1 Node Types

```
┌─────────────────┐
│  CLAIM NODE     │ ← Synthesized learning/consequence/shift
│  (claim_source) │
└────────┬────────┘
         │ supported_by
         ▼
┌─────────────────┐
│ EVIDENCE NODE   │ ← Raw artifacts (transcripts, photos, maps)
│  (evidence)     │
└─────────────────┘

┌─────────────────┐
│ VALIDATION NODE │ ← Agreement/verification record
│  (validation)   │
└────────┬────────┘
         │ evidenced_by
         ▼
┌─────────────────┐
│ META-EVIDENCE   │ ← Proof validation occurred
│ NODE            │
└─────────────────┘
```

### 9.2 Relationship Types

| Relationship | From | To | Description |
|--------------|------|----|-------------|
| `supported_by` | Claim | Evidence | Claim is grounded in this evidence |
| `validated_by` | Claim | Validation | Claim has been verified/agreed |
| `evidenced_by` | Validation | Meta-Evidence | Validation process is documented |
| `synthesizes` | Claim | Evidence[] | Claim aggregates multiple evidence sources |
| `supersedes` | Claim | Claim | Newer claim replaces/updates prior |
| `contradicts` | Claim | Claim | Claims are in tension |
| `extends` | Claim | Claim | Claim builds on prior work |

### 9.3 Cross-Cutting Pathway Tags

Pathways are **not nodes** but **tags applied to nodes**. A single evidence node can carry multiple pathway tags:

```
Evidence Node: "FGD-2 Nalubaaga Valley"
├── category: KG__ (Knowledge Gathering)
├── function: evidence
└── pathways: [RS__, RT__]  ← Multiple pathways
```

---

## 10. Geographic & Temporal Dimensions

### 10.1 Geographic Hierarchy

```
Project (Community Resilience & Wetland Stewardship)
│
├── Neighbourhood Level (7+)
│   ├── Mwesigwa
│   ├── Nakiwala
│   ├── Nabatanzi
│   ├── Najjuma
│   ├── Sekandi
│   ├── Senga
│   └── Nabiddo
│
├── Zone Level (within Community Mapping)
│   ├── BALINTUMA ZONE
│   ├── KIGOOWA
│   └── KIWATULE CENTRAL
│
└── Site Level
    ├── Kiwaatule Valley
    ├── Nalubaaga Valley/Wetland
    └── Lubigii Wetland
```

### 10.2 Temporal Sequence (Activity Flow)

```
1. Inception Meeting (project initiation)
       ↓ [KG__ + GG__]
2. Field Research (FGD, KII, mapping)
       ↓ [KG__]
3. Neighbourhood Dialogues
       ↓ [KNG__ + RT__]
4. Conference of Landstewards
       ↓ [KNG__ + GG__ + RL__]
5. Stakeholder Engagement
       ↓ [KG__ + KNG__]
6. Dissemination
       ↓ [KG__ + RS__]
7. Organizational Formation (Bylaws)
       ↓ [GG__ + RL__ + RG__]
8. Intervention Activities
       [INT__ + RN__ + RS__]
```

---

## 11. Implementation: File Reference

### 11.1 Source Format Distribution

| Format | Primary Use | Processing Status |
|--------|-------------|-------------------|
| `.docx` | Text documents (meetings, transcripts, reports) | Parseable |
| `.pdf` | Reports, maps, scanned documents | Parseable (with OCR) |
| `.xlsx` | Attendance lists, data tables | Parseable |
| `.kmz/.mpkx` | Geographic/spatial data | Requires GIS processing |
| `.m4a/.mp4` | Audio/video recordings | Requires transcription |
| `.jpg/.png` | Photos | Metadata + visual reference |

### 11.2 Naming Convention Patterns

**Meeting Minutes:**
- `MINUTES FOR [EVENT] [DATE/LOCATION].docx`
- `[NEIGHBOURHOOD] [meeting/dialogue].docx`
- `Minutes_ [Event Name].docx`

**Research Documents:**
- `FGD [number]_ [description] [zone].docx`
- `KII [number]_ [description] [zone].docx`

**Reports:**
- `[Activity] Report.docx`
- `[Location] field data report.pdf`
- `Technical [Activity] Report [Organization].docx`

**Maps:**
- `[Location]_Community_Final_Map.pdf`
- `[Location] Community Map.[format]`

### 11.3 Recommended Tagging Prefix System

For indexing (not mandatory renaming):

| Prefix | Category |
|--------|----------|
| `KG__` | Knowledge Gathering |
| `KNG__` | Kinship Gathering |
| `GG__` | Governance Gatherings |
| `INT__` | Intervention |
| `RT__` | re_trusting |
| `RS__` | re_stewarding |
| `RL__` | re_landing |
| `RN__` | re_naturing |
| `RG__` | re_generating |

---

## 12. Agent Training Use Cases

### 12.1 Document Classification

1. **Identify primary claim category** (KG/KNG/GG/INT)
2. **Assign claims engine function** (evidence/validation/meta_evidence/claim_source)
3. **Tag Obuntu pathways** (RT/RS/RL/RN/RG)
4. **Determine geographic scope** (project/neighbourhood/zone/site)
5. **Extract temporal markers** (dates, sequence position)

### 12.2 Evidence Chain Construction

1. **Identify claim sources** (reports, summaries)
2. **Trace back to underlying evidence** (transcripts, field data)
3. **Locate validation records** (attendance, signatures, votes)
4. **Link meta-evidence** (photos of events, confirmation records)
5. **Build graph relationships** (supported_by, validated_by, evidenced_by)

### 12.3 Claim Synthesis

1. **Extract factual observations** from evidence documents
2. **Frame as learning/consequence/shift** (not "event occurred")
3. **Anchor to specific evidence** with citations
4. **Identify validation pathway** (low-tech or high-tech)
5. **Tag with pathways** that claim supports

### 12.4 Validation Assessment

For each claim, assess:
- What evidence supports it?
- What validation process was used?
- Is there meta-evidence of that validation?
- Can both low-tech and high-tech validation coexist?

---

## 13. Data Quality Notes

### 13.1 Known Issues

- **Duplication:** Events 2/ and Events 3/ contain duplicates
- **Incomplete folders:** Some contain only photos/recordings
- **Naming inconsistency:** Mix of ALL CAPS, Title Case, lowercase
- **Date format variation:** Multiple date representations in filenames
- **Language mixing:** English and Luganda names/terms

### 13.2 Prioritization for Processing

| Priority | Document Type | Rationale |
|----------|---------------|-----------|
| 1 | FGD/KII Transcripts | Rich primary evidence |
| 2 | Meeting Minutes | Process documentation |
| 3 | Conference Reports | Claim sources |
| 4 | Attendance Lists | Meta-evidence |
| 5 | Maps & Technical Reports | Spatial evidence |
| 6 | Bylaws & Governance | Validation records |
| 7 | Photos & Media | Supporting reference |

---

## 14. Appendix: Quick Reference Tables

### 14.1 Category → Function → Pathway Quick Map

| Category | Typical Functions | Primary Pathways |
|----------|-------------------|------------------|
| `KG__` Knowledge | evidence, claim_source | RS__, RN__ |
| `KNG__` Kinship | evidence, claim_source | RT__, RL__ |
| `GG__` Governance | validation, meta_evidence | RL__, RG__ |
| `INT__` Intervention | evidence, validation | RS__, RN__, RG__ |

### 14.2 Document Subtype Quick Reference

| Document Type | Category | Function | Pathways |
|---------------|----------|----------|----------|
| FGD Transcript | KG__ | evidence | RS__, RT__ |
| KII Transcript | KG__ | evidence | RS__, RL__ |
| Neighbourhood Dialogue | KNG__ | evidence | RT__ |
| Committee Minutes | GG__ | validation | RL__, RG__ |
| Attendance List | KNG__/GG__ | meta_evidence | RT__, RL__ |
| Bylaws | GG__ | validation | RL__, RG__ |
| Conference Report | KNG__ | claim_source | RT__, RL__ |
| Field Data Report | KG__ | evidence/claim_source | RS__, RN__ |
| Community Map | KG__ | evidence | RS__, RL__ |
| Written Fears/Visions | KNG__ | evidence | RT__, RG__ |
| Training Records | INT__ | validation | RS__ |
| Restoration Logs | INT__ | evidence | RN__ |

---

**Last Updated:** January 2026
**Version:** 2.0 (Obuntu Resets Ontology Integration)
**Next Steps:** 
- Run document classification agent against corpus
- Build evidence chains for pilot claims
- Test validation-attestation collapse in graph structure
- Develop canonical claim templates from actual documents
