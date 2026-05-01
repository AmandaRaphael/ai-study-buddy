import { useState } from "react";
import "./App.css";

type Message = {
  id: number;
  role: "user" | "ai";
  content: string;
};

type ChatSession = {
  id: number;
  messages: Message[];
  createdAt: number;
};

const starterMessages: Message[] = [
  {
    id: 1,
    role: "ai",
    content: "Welcome! What would you like to learn today?",
  },
  {
    id: 2,
    role: "user",
    content: "Explain React",
  },
  {
    id: 3,
    role: "ai",
    content:
      "React is a JavaScript library for building interactive user interfaces using reusable components.",
  },
  {
    id: 4,
    role: "user",
    content: "Quiz me on it",
  },
  {
    id: 5,
    role: "ai",
    content: "1. What does JSX stand for, and why is it useful in React?",
  },
];

const quickActions = ["Explain", "Quiz Me", "Summarize", "Flashcards"];

const createBlankChat = (): ChatSession => ({
  id: Date.now(),
  createdAt: Date.now(),
  messages: [
    {
      id: Date.now() + 1,
      role: "ai",
      content: "Welcome! What would you like to learn today?",
    },
  ],
});

const initialChats: ChatSession[] = [
  {
    id: 101,
    createdAt: Date.now() - 1000,
    messages: starterMessages,
  },
];

const getChatTitle = (messages: Message[]) => {
  const firstUserMessage = messages.find((message) => message.role === "user");

  if (!firstUserMessage) {
    return "New chat";
  }

  return firstUserMessage.content.slice(0, 40);
};

export default function App() {
  const [chats, setChats] = useState<ChatSession[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState<number>(initialChats[0].id);
  const [input, setInput] = useState("");

  const activeChat =
    chats.find((chat) => chat.id === activeChatId) ??
    chats[0] ??
    createBlankChat();

  const handleSend = () => {
    if (!input.trim()) return;

    const trimmedInput = input.trim();
    const newMessage: Message = {
      id: Date.now(),
      role: "user",
      content: trimmedInput,
    };

    const chatId = activeChat.id;

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
            }
          : chat,
      ),
    );
    setInput("");

    setTimeout(() => {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    id: Date.now() + 1,
                    role: "ai",
                    content: `Here's a helpful explanation about: ${trimmedInput}`,
                  },
                ],
              }
            : chat,
        ),
      );
    }, 800);
  };

  const handleQuickAction = (action: string) => {
    setInput(action + " ");
  };

  const handleNewChat = () => {
    const newChat = createBlankChat();

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setInput("");
  };

  return (
    <div className="app-shell">
      <div className="app-frame">
        <aside className="sidebar">
          <button
            type="button"
            className="new-chat-button"
            onClick={handleNewChat}
          >
            <img
              src="/icon.png"
              alt=""
              aria-hidden="true"
              className="new-chat-icon"
            />
            <span>+ Learning lounge</span>
          </button>

          <div className="recent-chats">
            <p className="sidebar-heading">Recent</p>
            <div className="recent-chat-list">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  className={`recent-chat-item ${chat.id === activeChatId ? "recent-chat-item-active" : ""}`}
                  onClick={() => setActiveChatId(chat.id)}
                >
                  <span className="recent-chat-title">
                    {getChatTitle(chat.messages)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="main-panel">
          <header className="app-header">
            <div>
              <span className="app-badge">AI Study Buddy</span>
              <h1>{getChatTitle(activeChat.messages)}</h1>
              <p className="app-subtitle">Your personal AI study companion</p>
            </div>
          </header>

          <section className="quick-actions" aria-label="Quick actions">
            {quickActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => handleQuickAction(action)}
                className="quick-action"
              >
                {action}
              </button>
            ))}
          </section>

          <section className="chat-area" aria-label="Conversation">
            {activeChat.messages.map((message) => (
              <div
                key={message.id}
                className={`message-row ${message.role === "user" ? "message-row-user" : "message-row-ai"}`}
              >
                <div className={`message-bubble message-${message.role}`}>
                  <span className="message-label">
                    {message.role === "user" ? "You" : "AI"}
                  </span>
                  <p className="message-content">{message.content}</p>
                </div>
              </div>
            ))}
          </section>

          <div className="composer">
            <div className="composer-row">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your question here..."
                className="composer-input"
              />
              <button
                type="button"
                onClick={handleSend}
                className="send-button"
                disabled={!input.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
