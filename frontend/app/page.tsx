"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { chatWithAgent, clearChatSession, type ChatResponse } from "@/lib/api";
import { PatternRenderer } from "@/components/PatternRenderer";
import ReactMarkdown from "react-markdown";
import "@/styles/markdown.css";

interface Message {
  role: "user" | "assistant";
  content: string;
  tool_calls?: Array<{ function_name: string; arguments: any }>;
  tool_results?: any;
}

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [apiAvailable, setApiAvailable] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function initApp() {
      // Check if user has completed onboarding
      const profile = localStorage.getItem("tp_profile");
      if (!profile) {
        router.push("/onboarding");
        return;
      }

      // Test if chat API is available
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
        if (response.ok) {
          setApiAvailable(true);
          // Add welcome message
          setMessages([{
            role: "assistant",
            content: "Hi! I'm your brainstorming assistant. I have access to multiple ideation recipes and can help you explore ideas, solve problems, and think creatively. What would you like to brainstorm today?"
          }]);
        }
      } catch (error) {
        console.error("API not available:", error);
        setApiAvailable(false);
        setMessages([{
          role: "assistant",
          content: "⚠️ Backend server is not available. Please start the backend server to use the conversational agent.\n\nRun: `cd backend && python -m uvicorn main:app --reload --port 8000`"
        }]);
      }
    }

    initApp();
  }, [router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading || !apiAvailable) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response: ChatResponse = await chatWithAgent({
        message: userMessage.content,
        session_id: sessionId || undefined,
        user_id: "demo-user", // TODO: Get from auth/profile
      });

      // Update session ID
      if (!sessionId) {
        setSessionId(response.session_id);
      }

      // Add assistant response
      const assistantMessage: Message = {
        role: "assistant",
        content: response.message,
        tool_calls: response.tool_calls,
        tool_results: response.tool_results,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error processing your message. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = async () => {
    if (sessionId) {
      try {
        await clearChatSession(sessionId);
      } catch (error) {
        console.error("Error clearing session:", error);
      }
    }

    setSessionId(null);
    setMessages([{
      role: "assistant",
      content: "Hi! I'm your brainstorming assistant. I have access to multiple ideation recipes and can help you explore ideas, solve problems, and think creatively. What would you like to brainstorm today?"
    }]);
  };

  // Helper function to truncate agent response when tool results are present
  const truncateToFirstSentences = (text: string, maxSentences: number = 2): string => {
    // Match sentences ending with ., !, or ?
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const sentences = text.match(sentenceRegex);

    if (!sentences || sentences.length <= maxSentences) {
      return text;
    }

    return sentences.slice(0, maxSentences).join(' ').trim();
  };

  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      backgroundColor: "var(--background)",
    }}>
      {/* Header */}
      <header style={{
        padding: "16px 24px",
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--card)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>💭 Thought Partner</h1>
          <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "var(--muted)" }}>
            Conversational AI Brainstorming Assistant
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{
            fontSize: 12,
            color: apiAvailable ? "#4CAF50" : "#FF9800",
          }}>
            {apiAvailable ? "🟢 Connected" : "🟡 Offline"}
          </span>
          <button
            onClick={handleNewConversation}
            disabled={!apiAvailable}
            style={{
              padding: "8px 16px",
              fontSize: 14,
              backgroundColor: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: apiAvailable ? "pointer" : "not-allowed",
              opacity: apiAvailable ? 1 : 0.5,
            }}
          >
            New Conversation
          </button>
        </div>
      </header>

      {/* Chat Thread */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: 16,
                borderRadius: 12,
                backgroundColor: msg.role === "user" ? "var(--primary)" : "var(--card)",
                color: msg.role === "user" ? "white" : "var(--foreground)",
                border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
              }}
            >
              {/* Message content */}
              {msg.role === "assistant" ? (
                <div className="markdown-body" style={{ lineHeight: 1.6 }}>
                  <ReactMarkdown>
                    {msg.tool_results ? truncateToFirstSentences(msg.content) : msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {msg.content}
                </div>
              )}

              {/* Show tool calls if present */}
              {msg.tool_calls && msg.tool_calls.length > 0 && (
                <div style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid var(--border)",
                  fontSize: 13,
                  color: "var(--muted)",
                }}>
                  🔧 Used recipe: <strong>{msg.tool_calls[0].function_name}</strong>
                </div>
              )}

              {/* Render recipe results if present */}
              {msg.tool_results && (
                <div style={{ marginTop: 16 }}>
                  <PatternRenderer result={msg.tool_results} />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: "2px solid var(--primary)",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Composer */}
      <div style={{
        padding: 24,
        borderTop: "1px solid var(--border)",
        backgroundColor: "var(--card)",
      }}>
        <form onSubmit={handleSendMessage} style={{ display: "flex", gap: 12 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={apiAvailable ? "Describe what you want to brainstorm..." : "Backend offline..."}
            disabled={isLoading || !apiAvailable}
            style={{
              flex: 1,
              padding: "12px 16px",
              fontSize: 14,
              backgroundColor: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              outline: "none",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--primary)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--border)";
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !apiAvailable}
            style={{
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: (isLoading || !input.trim() || !apiAvailable) ? "not-allowed" : "pointer",
              opacity: (isLoading || !input.trim() || !apiAvailable) ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </form>
      </div>

      {/* Add spin animation */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
