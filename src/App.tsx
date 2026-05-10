import { useEffect, useState } from "react";
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
  summary?: string;
};

type StoredChatState = {
  chats: ChatSession[];
  activeChatId: number;
};

type ChatTab = "chat" | "summary";
type AppPage = "home" | "learn";

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
const CHAT_STORAGE_KEY = "ai-study-buddy.chat-state";

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

const API_BASE_URL = "http://localhost:8787";
const LEARN_PAGE_HASH = "#/learn";

const getPageFromHash = (hash: string): AppPage =>
  hash === LEARN_PAGE_HASH ? "learn" : "home";

const moveChatToTop = (
  chats: ChatSession[],
  chatId: number,
  updateMessages: (messages: Message[]) => Message[],
) => {
  const targetChat = chats.find((chat) => chat.id === chatId);

  if (!targetChat) {
    return chats;
  }

  const updatedChat: ChatSession = {
    ...targetChat,
    messages: updateMessages(targetChat.messages),
  };

  return [updatedChat, ...chats.filter((chat) => chat.id !== chatId)];
};

const isValidMessage = (value: unknown): value is Message => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Record<string, unknown>;

  return (
    typeof message.id === "number" &&
    (message.role === "user" || message.role === "ai") &&
    typeof message.content === "string"
  );
};

const isValidChatSession = (value: unknown): value is ChatSession => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const chat = value as Record<string, unknown>;

  return (
    typeof chat.id === "number" &&
    typeof chat.createdAt === "number" &&
    Array.isArray(chat.messages) &&
    chat.messages.every(isValidMessage) &&
    (typeof chat.summary === "string" || typeof chat.summary === "undefined")
  );
};

const loadStoredChatState = (): StoredChatState => {
  if (typeof window === "undefined") {
    return {
      chats: initialChats,
      activeChatId: initialChats[0].id,
    };
  }

  try {
    const storedState = window.localStorage.getItem(CHAT_STORAGE_KEY);

    if (!storedState) {
      return {
        chats: initialChats,
        activeChatId: initialChats[0].id,
      };
    }

    const parsedState = JSON.parse(storedState) as Partial<StoredChatState>;

    if (
      !Array.isArray(parsedState.chats) ||
      !parsedState.chats.every(isValidChatSession)
    ) {
      return {
        chats: initialChats,
        activeChatId: initialChats[0].id,
      };
    }

    const chats = parsedState.chats;
    const activeChatId =
      typeof parsedState.activeChatId === "number" &&
      chats.some((chat) => chat.id === parsedState.activeChatId)
        ? parsedState.activeChatId
        : chats[0]?.id ?? initialChats[0].id;

    return {
      chats: chats.length > 0 ? chats : initialChats,
      activeChatId,
    };
  } catch {
    return {
      chats: initialChats,
      activeChatId: initialChats[0].id,
    };
  }
};

export default function App() {
  const [storedState] = useState<StoredChatState>(() => loadStoredChatState());
  const [chats, setChats] = useState<ChatSession[]>(storedState.chats);
  const [activeChatId, setActiveChatId] = useState<number>(
    storedState.activeChatId,
  );
  const [page, setPage] = useState<AppPage>(() =>
    typeof window === "undefined" ? "home" : getPageFromHash(window.location.hash),
  );
  const [activeTab, setActiveTab] = useState<ChatTab>("chat");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activeChat =
    chats.find((chat) => chat.id === activeChatId) ??
    chats[0] ??
    createBlankChat();

  useEffect(() => {
    window.localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify({
        chats,
        activeChatId,
      } satisfies StoredChatState),
    );
  }, [chats, activeChatId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncPageFromHash = () => {
      setPage(getPageFromHash(window.location.hash));
    };

    window.addEventListener("hashchange", syncPageFromHash);

    return () => window.removeEventListener("hashchange", syncPageFromHash);
  }, []);

  const goToPage = (nextPage: AppPage) => {
    if (typeof window === "undefined") {
      setPage(nextPage);
      return;
    }

    const nextHash = nextPage === "learn" ? LEARN_PAGE_HASH : "";

    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
      return;
    }

    setPage(nextPage);
  };

  const requestAssistantReply = async (
    messages: Message[],
    mode: "chat" | "summary",
  ) => {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        mode,
      }),
    });

    const responseBody = (await response.json()) as {
      reply?: string;
      error?: string;
    };

    if (!response.ok || !responseBody.reply) {
      throw new Error(
        responseBody.error ||
          "The assistant could not respond right now. Please try again.",
      );
    }

    return responseBody.reply;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const trimmedInput = input.trim();
    const newMessage: Message = {
      id: Date.now(),
      role: "user",
      content: trimmedInput,
    };

    const chatId = activeChat.id;
    const updatedMessages = [...activeChat.messages, newMessage];

    setChats((prev) => moveChatToTop(prev, chatId, () => updatedMessages));
    setInput("");
    setErrorMessage("");
    setIsSending(true);

    try {
      const assistantReply = await requestAssistantReply(updatedMessages, "chat");

      setChats((prev) =>
        moveChatToTop(prev, chatId, (messages) => [
          ...messages,
          {
            id: Date.now() + 1,
            role: "ai",
            content: assistantReply,
          },
        ]),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while contacting the chat server.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickAction = (action: string) => {
    if (action === "Summarize") {
      void handleSummarize();
      return;
    }

    setInput(action + " ");
  };

  const handleSummarize = async () => {
    const chatId = activeChat.id;

    setErrorMessage("");
    setIsSummarizing(true);

    try {
      const summary = await requestAssistantReply(activeChat.messages, "summary");

      setChats((prev) =>
        moveChatToTop(prev, chatId, (messages) => messages).map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                summary,
              }
            : chat,
        ),
      );
      setActiveTab("summary");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the summary.",
      );
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleNewChat = () => {
    const newChat = createBlankChat();

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setActiveTab("chat");
    setInput("");
  };

  if (page === "home") {
    return (
      <div className="landing-shell">
        <div className="landing-frame">
          <div className="landing-copy">
            <span className="landing-kicker">AI Study Buddy</span>
            <h1>I need to learn a few things.</h1>
            <p className="landing-lede">
              Turn that into focused study sessions, quick quizzes, and clean
              summaries without losing your momentum.
            </p>

            <div className="landing-actions">
              <button
                type="button"
                className="landing-primary"
                onClick={() => goToPage("learn")}
              >
                Open learning space
              </button>
              <button
                type="button"
                className="landing-secondary"
                onClick={() => goToPage("learn")}
              >
                Start with chat
              </button>
            </div>
          </div>

          <div className="landing-preview" aria-label="Study buddy preview">
            <div className="preview-card">
              <span className="preview-label">How it helps</span>
              <ul className="preview-list">
                <li>Ask for explanations in plain language</li>
                <li>Switch into quiz mode when you want recall practice</li>
                <li>Generate summaries after each session</li>
              </ul>
            </div>

            <div className="preview-note">
              <span className="preview-note-title">Try prompts like:</span>
              <p>"Explain photosynthesis like I am 12."</p>
              <p>"Quiz me on JavaScript closures."</p>
              <p>"Summarize my last chat into revision notes."</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  onClick={() => {
                    setActiveChatId(chat.id);
                    setActiveTab("chat");
                  }}
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
            <button
              type="button"
              className="home-link-button"
              onClick={() => goToPage("home")}
            >
              Back to home
            </button>
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

          <section className="content-tabs" aria-label="Content tabs">
            <button
              type="button"
              className={`content-tab ${activeTab === "chat" ? "content-tab-active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              Chat
            </button>
            <button
              type="button"
              className={`content-tab ${activeTab === "summary" ? "content-tab-active" : ""}`}
              onClick={() => setActiveTab("summary")}
              disabled={!activeChat.summary && !isSummarizing}
            >
              Summary
            </button>
          </section>

          {activeTab === "chat" ? (
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

              {isSending ? (
                <div className="message-row message-row-ai">
                  <div className="message-bubble message-ai">
                    <span className="message-label">AI</span>
                    <p className="message-content">Thinking...</p>
                  </div>
                </div>
              ) : null}
            </section>
          ) : (
            <section className="summary-area" aria-label="Summary view">
              <div className="summary-card">
                <span className="summary-label">Conversation summary</span>
                <p className="summary-text">
                  {isSummarizing
                    ? "Building your summary..."
                    : activeChat.summary ||
                      "No summary yet. Use the Summarize action to generate one."}
                </p>
              </div>
            </section>
          )}

          <div className="composer">
            {errorMessage ? <p className="composer-error">{errorMessage}</p> : null}
            <div className="composer-row">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your question here..."
                className="composer-input"
                disabled={isSending || isSummarizing || activeTab === "summary"}
              />
              <button
                type="button"
                onClick={handleSend}
                className="send-button"
                disabled={
                  !input.trim() ||
                  isSending ||
                  isSummarizing ||
                  activeTab === "summary"
                }
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
