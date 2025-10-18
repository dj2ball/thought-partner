"use client";
import ReactMarkdown from "react-markdown";
import "@/styles/markdown.css";
import { PatternRenderer } from "./PatternRenderer";

function historyToMarkdown(history: any[]): string {
  const lines: string[] = [];
  for (const entry of history || []) {
    lines.push(`## 🧩 Loop ${entry.loop ?? ""}`);
    for (const step of entry.substeps || []) {
      const role = step.role || "Agent";
      const out = step.output || {};
      if ((role as string).toLowerCase().startsWith("optimist") && out.proposals) {
        for (const p of out.proposals) {
          lines.push(`### 🟢 ${role}\n**Proposal:** *${p.title || "Idea"}*\n> ${p.why || ""}\n`);
        }
      } else if ((role as string).toLowerCase().startsWith("skeptic") && out.critiques) {
        for (const c of out.critiques) {
          const ev = c.evidence ? ` (evidence: ${c.evidence})` : "";
          lines.push(`### 🔴 ${role}\n**Critique:** *${c.target || ""}*\n> ${c.risk || c.issue || ""}${ev}\n`);
        }
      } else if ((role as string).toLowerCase().startsWith("mediator") && out.synthesis) {
        for (const s of out.synthesis) {
          lines.push(`### ⚪ ${role}\n**Synthesis:** *${s.direction || "Synthesis"}*\n> Trade-off: ${s.trade_off || ""}\n`);
        }
      } else {
        lines.push(`### ${role}\n\n\`\`\`json\n${JSON.stringify(out, null, 2)}\n\`\`\`\n`);
      }
      lines.push(`---`);
    }
  }
  return lines.join("\n");
}

function ThinkingIndicator({ recipeName, loops }: { recipeName: string; loops: number }) {
  return (
    <div className="card thinking-indicator">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="spinner"></div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Running {recipeName}...
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {loops} loops • Multi-agent debate in progress
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResultCard({ message }: { message: any }) {
  const res = message.result;
  if (!res) return null;

  // Show thinking indicator
  if (res.status === "thinking") {
    return <ThinkingIndicator recipeName={res.recipe_name} loops={res.loops} />;
  }

  // Get recipe information for pattern-specific rendering
  const recipeId = message.recipeId;
  const recipeName = res.recipe_name || recipeId || "Unknown Recipe";
  
  // Determine pattern type from message params or result
  let pattern = "single_shot"; // default
  if (message.params?.workflow_type) {
    pattern = message.params.workflow_type;
  } else if (message.mode === "iterative") {
    pattern = "iterative";
  }

  // Legacy markdown handling
  if (res.markdown) {
    return <div className="card markdown-body"><ReactMarkdown>{res.markdown}</ReactMarkdown></div>;
  }
  
  // Legacy history handling (for backward compatibility)
  if (res.history && Array.isArray(res.history)) {
    const md = historyToMarkdown(res.history);
    if (md.trim()) {
      return <div className="card markdown-body"><ReactMarkdown>{md}</ReactMarkdown></div>;
    }
  }

  // Use pattern-specific renderer
  return (
    <div className="card">
      <PatternRenderer 
        result={res}
        pattern={pattern}
        recipeName={recipeName}
      />
    </div>
  );
}