# AI Study Buddy

A React chat interface for studying, asking questions, and keeping lightweight recent chat history in a sidebar.

## Current Features

- Chat-style study interface with separate AI and user message bubbles
- `+ Learning lounge` button to start a fresh chat session
- Recent chat sidebar using the first user question as the chat title
- Quick action buttons for common study flows like explain, quiz, summarize, and flashcards

## Tech Stack

- React
- TypeScript
- Vite

## Run Locally

```bash
npm install
npm run dev
```

## Other Commands

```bash
npm run build
npm run lint
npm run preview
```

## Notes

- Current chat sessions are stored only in component state, so they reset on refresh.
- Project follow-up items are tracked in [docs/TODO.md](docs/TODO.md).
