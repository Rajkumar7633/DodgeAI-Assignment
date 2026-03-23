# DodgeAI Assignment

Live Demo: [https://dodge-ai-assignment-ten.vercel.app/](https://dodge-ai-assignment-ten.vercel.app/)  
Repository: [https://github.com/Rajkumar7633/DodgeAI-Assignment](https://github.com/Rajkumar7633/DodgeAI-Assignment)

## Overview

This project implements a graph-based modeling and query system for Order-to-Cash (O2C) data.

The application:
- Loads SAP O2C JSONL datasets
- Builds an entity relationship graph
- Visualizes nodes/edges in an interactive UI
- Provides a chat interface grounded in dataset context
- Uses an LLM provider (Gemini/Groq/OpenRouter/Cohere/HuggingFace via env config) with dataset fallback behavior

## Tech Stack

- Next.js (App Router)
- TypeScript
- `react-force-graph-2d` for graph visualization
- API routes for graph and chat endpoints
- Google Gemini SDK (default in this deployment via env vars)

## Project Structure

- `src/app` - UI pages and API routes
- `src/components` - graph, chat, and detail card components
- `src/lib` - graph loading/modeling, chat orchestration, deterministic dataset QA
- `data/sap-o2c-data` - dataset files (JSONL)
- `sessions` - AI coding session notes/transcripts

## Graph Modeling

### Nodes
- Journal Entry nodes (`je:*`)
- Billing Document nodes (`bd:*`)
- Customer/Business Partner nodes (`cust:*`)

### Edges
- Journal Entry -> Billing Document via `referenceDocument`
- Billing Document -> Customer via `soldToParty`

This produces an O2C context graph that supports document tracing and relationship exploration.

## Data Ingestion and Storage Choice

- Source files are JSONL from the provided dataset.
- The current implementation loads and transforms files from disk at runtime (`data/sap-o2c-data`).
- Rationale: fastest path for assignment delivery, easy local reproducibility, no external DB setup.

Tradeoff:
- Great for assignment scope and moderate data volumes.
- For large-scale production usage, move to a database/graph store and caching layer.

## Conversational Query Interface

Chat flow:
1. User sends a natural language message.
2. Server builds graph context from loaded dataset entities.
3. Provider-specific LLM call is attempted (based on `LLM_PROVIDER` and API key env vars).
4. If model call fails or credentials are missing, deterministic dataset QA fallback is used where possible.

The response is always designed to stay grounded in graph/dataset context.

## Prompting Strategy

System prompt in `src/lib/llm.ts`:
- Constrains answers to provided graph context
- Instructs model to avoid unsupported claims
- Requires brief acknowledgment when answer is not present in context

This keeps output focused on business entities and relationships from the dataset.

## Guardrails

Implemented guardrails:
- Context-grounded system instruction for chat responses
- Deterministic fallback from dataset for numeric/document lookups
- No hardcoded demo answers
- Clear failure messaging when model request fails

Recommended next guardrail enhancement:
- Explicit off-topic rejection message (e.g., reject general knowledge/creative prompts outside O2C dataset scope).

## Supported Example Queries

- "How many journal entries are in the graph?"
- "How many billing documents are in the graph?"
- "What reference document is linked to accounting document 9400000220?"
- "What accounting document is linked to reference document 90504219?"

## Setup Instructions

### 1) Install dependencies

```bash
npm install
```

### 2) Add environment variables

Create `.env` in project root:

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=YOUR_KEY_HERE
GEMINI_MODEL=gemini-1.5-flash
```

### 3) Add dataset

Extract the provided archive so this directory exists:

`data/sap-o2c-data/`

### 4) Run locally

```bash
npm run dev
```

### 5) Build for production

```bash
npm run build
npm run start
```

## Deployment (Vercel)

Set these Environment Variables in Vercel:
- `LLM_PROVIDER=gemini`
- `GEMINI_API_KEY=<your key>`
- `GEMINI_MODEL=gemini-1.5-flash`

Framework preset: Next.js  
Root directory: `./`  
Build command: default (`next build`)  
Install command: default (`npm install`)

## AI Coding Sessions

AI assistance was used during development for implementation speed and iteration.

- Approximate contribution split:
  - Manual coding and decisions: ~70%
  - AI-assisted coding/debugging: ~30%

See `sessions/` for session notes and transcript guidance.

## Notes

- `.env` is gitignored and not committed.
- Dataset zip is excluded from git; extracted dataset directory is included in this submission.
