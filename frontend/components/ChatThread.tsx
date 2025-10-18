"use client";
import { useChat } from "@/lib/store";
import { ResultCard } from "./ResultCard";

export function ChatThread() {
  const { messages } = useChat();
  return (
    <div className="thread">
      {messages.map(m => (
        <div key={m.id} className={`message ${m.role}`}>
          {m.text && <div style={{opacity:.9, marginBottom:6}}>{m.text}</div>}
          {m.result && <ResultCard message={m} />}
          {m.error && <div className="card" style={{borderColor:"#7c2a2a", color:"#ff6b6b"}}>{m.error}</div>}
        </div>
      ))}
      {!messages.length && (
        <div className="message assistant">
          <div className="card">
            <h4>Welcome 👋</h4>
            <p>Select <b>Multi-Agent Debate</b>, type a problem, and click <b>Run</b> to start a structured debate between AI agents.</p>
            <p style={{fontSize:12, color:"var(--muted)", marginTop:8}}>
              Your personalized profile will influence how the agents think and respond.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}