# PharmaSource AI — Evidence-Grounded Pharmaceutical Document Research Assistant

PharmaSource AI is a pharmaceutical research intelligence platform that enables commercial, market access, and healthcare business teams to query a curated document repository, inspect original supporting passages, verify cited claims, and evaluate evidence strength with strict abstention and citation validation rules.

***

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and domain choices were confirmed during Phase 1 clarification:

- **Confirmed Decision 1: Hybrid Retrieval Architecture**: Hybrid semantic vector retrieval combined with keyword re-ranking to deliver high precision on specialized pharmaceutical nomenclature, trial endpoints, dosages, and dates.
- **Confirmed Decision 2: Immediate Demo Onboarding**: Pre-load a comprehensive synthetic oncology demonstration collection on initial load so users can query and inspect evidence without needing to upload files first.
- **Confirmed Decision 3: Therapeutic Focus**: The fictional demonstration collection centers on targeted oncology and biologics commercial launch (featuring a fictional antibody-drug conjugate "OncoZen-101" / "Zeltaximab" commercial launch, Phase 3 trial data, market access dossier, regulatory advisory notes, and competitive landscape report).

***

## 1. Overview & Core Concept

- **What It Does**: PharmaSource AI ingests research documents (PDF, DOCX, TXT, Markdown), splits them into context-preserving chunks with section/page metadata, runs hybrid vector and keyword retrieval against user questions, generates evidence-grounded answers via Gemini with strict structured citations, verifies each citation against actual retrieved excerpts, and provides an Evaluation Lab to benchmark answerability, abstention, conflict detection, and prompt-injection resistance.
- **Target Audience / Persona**: Pharmaceutical commercial research teams, market access directors, competitive intelligence leads, business development analysts, and portfolio managers who need rapid, audit-ready document synthesis with zero hallucinated claims.
- **Key Value**: Replaces black-box generic chatbot responses with deterministic evidence tracing. Every factual claim is bound to an exact document passage with verifiable coordinates, clear evidence strength ratings, explicit limitation disclosures, and automatic abstention when evidence is insufficient or contradictory.
- **Boundary & Compliance**: Explicitly designed solely for research and document navigation. It prohibits medical diagnosis, personalized treatment advice, drug recommendations to patients, and clinical decision-making.

***

## 2. User Experience & Visual Design

### Key User Flows

1. **Research Assistant (Primary Workspace)**:
   - *Left Panel*: Document collection manager with search filter, active toggle checkboxes per document, document statistics (page count, chunk count, file type), upload dropzone, and synthetic demo reset button.
   - *Center Panel*: Natural language query input, suggested research prompts, conversational message stream, structured answers with direct answer summary, key findings, evidence strength indicator, limitations note, copy action, and export research note action.
   - *Right Panel (Evidence Inspector)*: Interactive source viewer. Clicking any in-text citation badge immediately highlights and reveals the exact retrieved passage, document title, section heading, page number, and similarity score.
2. **Document Library**:
   - Comprehensive tabular inventory of all indexed documents with metadata: title, filename, file type, file size, upload timestamp, extracted sections, chunk count, and ingestion status.
   - Document text previewer modal with raw extracted chunks and OCR/text-density warnings.
   - Upload drawer supporting drag-and-drop for PDF, DOCX, TXT, and Markdown files with client and server-side validation.
3. **Evaluation Lab**:
   - Automated benchmark test suite executing 7 critical pharmaceutical AI evaluation categories:
     - *Answerable Questions* (direct evidence present)
     - *Partially Answerable Questions* (missing endpoint or date)
     - *Unanswerable Questions* (testing correct abstention: *"I couldn't find sufficient evidence for that in the selected documents."*)
     - *Conflicting Evidence* (two documents report inconsistent figures; testing dual citation)
     - *Citation Validity Tests* (verifying zero hallucinated chunk IDs or phantom URLs)
     - *Prompt Injection Tests* (documents attempting to override assistant rules or leak keys)
     - *Out-of-Scope Clinical Requests* (testing refusal of diagnosis and treatment advice)
   - Real-time test execution runner, pass/fail scorecards, citation accuracy rate, abstention precision, and detailed failure review drawer.
4. **About & Limitations**:
   - Clear disclosure of single-user prototype boundaries, evidence verification mechanics, responsible AI safeguards, data retention policies, and clinical safety disclaimers.

### Visual Identity & Theme

- **Design Philosophy**: Clinical authority, high spatial discipline, and restrained enterprise healthcare typography adhering strictly to the Universal Frontend Design Constitution.
- **Color Palette (60-30-10 Rule)**:
  - *60% Dominant Neutral Canvas*: Pristine clinical slate-white (`#F8FAFC` / `#FFFFFF`).
  - *30% Structural Surfaces*: Subtle hairline border grid (`#E2E8F0`), elevated card surfaces (`#FFFFFF`), quiet text hierarchy (`#0F172A` primary text, `#64748B` muted labels).
  - *10% Telemetry & Accent Budget*: Restrained cobalt blue (`#2563EB`) for interactive anchors and focused tabs, clinical emerald (`#059669`) for verified evidence, amber (`#D97706`) for partial support or conflicting documents, and rose (`#DC2626`) for abstentions or validation alerts.
- **Typography & Formatting**:
  - Display & Headings: `Plus Jakarta Sans` with balanced line wraps (`text-wrap: balance`).
  - Body & Excerpts: `DM Sans` / `Plus Jakarta Sans` for dense readability.
  - Metrics, Coordinates, and Citation IDs: Tabular figures (`font-mono tabular-nums`).
- **Anti-Slop Discipline**:
  - Zero static pill envelopes around metadata: unboxed inline text with typographic separators (`·`).
  - Top Bar Contract: 3 zones only (Brand wordmark `PharmaSource AI`, 4 single-line nav tabs, 1 action button `New Research Session`).
  - Zero decorative pulsing dots, zero fake innovation scoreboards, and no thick left accent bars.

***

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Hybrid Retrieval Engine (Semantic + BM25 Lexical)
- *Chosen Approach*: Server-side in-memory vector index computing cosine similarity against chunk embeddings (using Gemini embedding model), combined with BM25/keyword frequency scoring and re-ranking.
- *Why*: Pharmaceutical queries often target exact acronyms (e.g., "ADC", "PFS", "ORR", "HER2-low", "ICD-10") alongside conceptual queries (e.g., "payer reimbursement headwinds in Germany"). Pure vector search frequently misses exact numeric or acronym matches, while hybrid retrieval delivers superior precision.
- *Alternatives Considered*: External vector database (e.g., Pinecone/Chroma). Passed over to avoid fragile external network dependencies and latency in the prototype runtime environment.

### Decision 2: In-Process Document Parsers
- *Chosen Approach*: Lightweight server-side parsers for PDF, DOCX, TXT, and Markdown files with section heading and page boundary detection. Includes heuristic checks for scanned/empty documents (< 50 words) to flag OCR requirements.
- *Why*: Fast, self-contained, zero-dependency on external cloud converters, keeping files private to the session.

### Decision 3: Deterministic Two-Stage Citation Validation Pipeline
- *Chosen Approach*:
  1. *Stage 1*: Server prompts Gemini with explicit JSON schema requiring structured citation tags linked only to provided chunk IDs `[CHUNK-xxxxx]`.
  2. *Stage 2*: Backend validator parses the response, verifies that every cited chunk ID exists in the active retrieved set, verifies the excerpt text matches the source chunk content, verifies document ownership, and strips/flags any ungrounded citation.
  3. If citation verification fails or phantom claims are detected, the system tags the claim as unsupported and issues a verification warning.
- *Why*: Eliminates hallucinated citations and gives commercial teams audit-proof verification.

### Decision 4: Synthetic Demonstration Dataset Architecture
- *Chosen Approach*: Five comprehensive, highly realistic fictional documents set in the oncology commercialization space:
  1. `Zeltaximab-ADC_Phase3_ClinicalSummary.txt` (Phase 3 trial endpoints, PFS, OS, adverse event profile)
  2. `Zeltaximab_Global_Commercial_Assessment_2025.txt` (Peak sales projections, EU5 vs US pricing, reimbursement timeline)
  3. `Zeltaximab_Product_Monograph_Draft.txt` (Mechanism of action, dosing, storage, contraindications)
  4. `Competitor_Landscape_HER2_Targeted_Oncology.txt` (Conflicting market share estimates and competitor launch timelines)
  5. `Advisory_Board_Meeting_Minutes_Nov2025.txt` (Key opinion leader sentiment, payer access barriers, and security probe injection tests)
- *Why*: Ensures realistic testing of all acceptance criteria (answerable, unanswerable, conflicting, injection, clinical refusal) without real-world medical misinformation liability.

***

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PharmaSource AI Web UI                        │
│ ┌──────────────────────┐ ┌────────────────────┐ ┌────────────────────┐ │
│ │  Document Library &  │ │ Research Assistant │ │   Evaluation Lab   │ │
│ │  Upload Dropzone     │ │ 3-Panel Workspace  │ │   Benchmark Runner │ │
│ └──────────┬───────────┘ └─────────┬──────────┘ └──────────┬─────────┘ │
└────────────┼───────────────────────┼───────────────────────┼───────────┘
             │                       │                       │
             ▼                       ▼                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Server API Routes & Middleware (/api/*)              │
│ ┌─────────────────────────┬─────────────────────────┬────────────────┐ │
│ │  POST /api/documents    │  POST /api/chat/query   │ POST /api/eval │ │
│ │  - File Validation      │  - Question Validation  │ - Run 7 test   │ │
│ │  - Text & Page Parse    │  - Hybrid Retrieval     │   categories   │ │
│ │  - Chunking & Embedding │  - Prompt Assembly      │ - Score cards  │ │
│ │  - Demo Data Seed       │  - Gemini 3.8 Call      │ - Abstention & │ │
│ │                         │  - Citation Validator   │   Citations    │ │
│ └──────────┬──────────────┴───────────┬─────────────┴────────┬───────┘ │
└────────────┼──────────────────────────┼──────────────────────┼─────────┘
             │                          │                      │
             ▼                          ▼                      ▼
┌─────────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐
│ Document Storage &      │  │ Gemini API via SDK   │  │ Citation &      │
│ In-Memory Hybrid Index  │  │ @google/genai        │  │ Grounding Guard │
│ - Chunk store           │  │ - gemini-3.8-flash   │  │ - Chunk lookup  │
│ - Embeddings cache      │  │ - systemInstruction  │  │ - Excerpt match │
│ - Inverted index (BM25) │  │ - JSON responseSchema│  │ - Warning flags │
└─────────────────────────┘  └──────────────────────┘  └─────────────────┘
```

### Core Entities & Data Model

- **Document**: `{ id, title, filename, fileType, fileSize, uploadDate, isDemo, pageCount, chunkCount, status, warning }`
- **DocumentChunk**: `{ id, documentId, documentTitle, chunkIndex, text, pageNumber, sectionHeading, wordCount, embedding: number[] }`
- **Citation**: `{ id, chunkId, documentId, documentTitle, pageNumber, sectionHeading, excerptText, similarityScore, isVerified }`
- **AnswerPayload**: `{ directAnswer, keyFindings: Array<{ claim: string, citationIds: string[] }>, evidenceStrength: 'Supported' | 'Partially Supported' | 'Insufficient Evidence' | 'Conflicting Evidence', citations: Citation[], limitations: string, sourcesSearchedCount: number, passagesRetrievedCount: number, validationWarnings: string[] }`
- **EvaluationTestCase**: `{ id, category, question, expectedBehavior, targetDocumentIds, result?: EvaluationTestResult }`

### Verification & Testing Plan

1. **Document Ingestion Test**: Upload PDF, DOCX, TXT, and Markdown files; verify chunk generation, page numbers, and low-text warning detection.
2. **Hybrid Retrieval Test**: Query specific drug names and endpoints; confirm top-ranked chunks match expected evidence.
3. **Structured Response & Citation Validation Test**: Confirm Gemini generates exact chunk citations and server validator rejects phantom references.
4. **Abstention Test**: Test unanswerable queries to ensure standard abstention message is triggered.
5. **Evaluation Lab Suite**: Run full 7-category benchmark suite verifying pass rates, citation rates, and abstention precision.
6. **Production Build & Compilation**: Run `compile_applet` and `lint_applet` to guarantee zero TypeScript or build errors.
