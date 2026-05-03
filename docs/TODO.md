# TODO

- [x] Make the `Recent` list behave like true recent history.
  - Move a chat to the top when it receives a new message, not only when it is first created.

- [ ] Decide whether a "new chat page" should remain an in-app state switch or become a real routed page.
  - Consider URL support, back-button behavior, refresh behavior, and direct linking.

- [ ] Decide whether `createdAt` should stay in the chat model.
  - Use it for visible sorting or metadata, or remove it if chat ordering no longer depends on it.

- [ ] Limit the amount of chat history sent to OpenAI on each request.
  - Do not send the entire conversation history every time.
  - Start with trimming to the last N messages.
  - Replace simple message-count trimming later with approximate size or token-based trimming.
  - Preserve the most recent conversational context first when trimming.
  - Enforce a hard backend cap for request context size or message count.
  - Add temporary development logging or monitoring for request size while tuning limits.
  - Add a longer-term summary strategy for old chat history so long sessions can keep context without resending everything.
  - Decide whether the UI should eventually indicate that older context has been trimmed for long-running chats.

- [ ] Replace the hardcoded frontend API base URL with a safer setup.
  - Replace `http://localhost:8787` with a relative `/api/chat` path.
  - Use a Vite dev proxy for local development.
  - If frontend and backend are deployed separately later, move the API base URL to environment-based config instead of hardcoding it in the client.
