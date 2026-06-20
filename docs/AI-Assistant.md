# AI Assistant

The Civic Assistant includes an AI chat mode that uses **OpenRouter** to analyze JSON data and answer questions conversationally.

## Core Concept

The AI has **no built-in knowledge base**. Every answer is derived purely from the JSON data provided as context in the request. The app fetches data from an API, converts it to a JSON string, and sends it to OpenRouter — the AI analyzes that string and responds based solely on what's in it.

## How It Works

```
User Question
    |
    v
CivicAssistant.tsx (handleAiSubmit)
    |-- Fetches JSON data from an endpoint
    |-- JSON.stringify(data) → converts response to string
    |-- Calls askAI(question, stringifiedContext)
    |
    v
assistant.ts (askAI)
    |-- POST to https://openrouter.ai/api/v1/chat/completions
    |-- Model: openrouter/owl-alpha
    |-- Sends system prompt + context (stringified JSON) + question
    |
    v
OpenRouter API → analyzes JSON string → returns answer
    |
    v
Response displayed in chat UI
```

## Key Files

| File | Purpose |
|---|---|
| `src/lib/assistant.ts` | `askAI()` — calls OpenRouter with JSON context |
| `src/components/ui/CivicAssistant.tsx` | Chat UI — fetches data, stringifies, triggers AI |
| `src/data/services/*.json` | Service datasets (used by Search mode via CivicEngine) |

## JSON Context Flow

The AI receives data as a stringified JSON payload within the user message:

```
Context:
  <JSON.stringify(data, null, 2)>

Question:
  <user's question>
```

The system prompt strictly restricts the AI to answer **only** from the provided JSON context — no external knowledge, no hallucination. If the context lacks relevant data, it returns:
> "I could not find information related to your request."

## Setup

1. Get an API key from [OpenRouter](https://openrouter.ai)
2. Set it in your environment:

```
VITE_OPENROUTER_API_KEY=your_key_here
```

Missing key returns a configuration notice instead of crashing.

## Current State

- AI mode fetches placeholder data (`jsonplaceholder.typicode.com/users`) for context — replace with real endpoints in production.
- Search mode uses `CivicEngine` for client-side fuzzy matching across local JSON service files (no AI involved)
- The AI has zero local knowledge — everything it knows comes from the JSON string you pass in
