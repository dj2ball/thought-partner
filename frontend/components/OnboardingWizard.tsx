"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/profile-types";

const GOALS = [
  "Brainstorm ideas",
  "Solve problems",
  "Plan projects",
  "Research topics",
  "Write content",
  "Analyze data",
  "Design systems",
  "Learn concepts"
];

const DOMAINS = [
  "Technology",
  "Business",
  "Education",
  "Healthcare",
  "Creative Arts",
  "Science",
  "Marketing",
  "Personal Development"
];

const OUTPUT_FORMATS = [
  { id: "markdown", label: "Markdown" },
  { id: "json", label: "JSON" },
  { id: "table", label: "Table" },
  { id: "csv", label: "CSV" },
  { id: "slide-outline", label: "Slide Outline" }
];

const COGNITIVE_DIMENSIONS = [
  {
    key: "divergent",
    label: "Thinking Style",
    low: "Convergent",
    high: "Divergent",
    tooltip: "Convergent: Focus on one best answer. Divergent: Explore many possibilities."
  },
  {
    key: "big_picture",
    label: "Scope",
    low: "Details",
    high: "Big Picture",
    tooltip: "Details: Focus on specifics. Big Picture: See overall patterns."
  },
  {
    key: "speed_over_evidence",
    label: "Speed vs Evidence",
    low: "Evidence-based",
    high: "Fast & intuitive",
    tooltip: "Evidence: Thorough research. Fast: Quick insights and hunches."
  },
  {
    key: "risk_tolerance",
    label: "Risk Tolerance",
    low: "Conservative",
    high: "Bold",
    tooltip: "Conservative: Proven approaches. Bold: Experimental ideas."
  },
  {
    key: "visual_pref",
    label: "Visual Preference",
    low: "Text-heavy",
    high: "Visual-heavy",
    tooltip: "Text: Detailed explanations. Visual: Diagrams and charts."
  }
];

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  low: string;
  high: string;
  tooltip: string;
}

function Slider({ value, onChange, label, low, high, tooltip }: SliderProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, color: "var(--muted)" }} title={tooltip}>ⓘ</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "var(--muted)", minWidth: 80 }}>{low}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: 12, color: "var(--muted)", minWidth: 80, textAlign: "right" }}>{high}</span>
        <span style={{ fontSize: 12, minWidth: 30 }}>{value}</span>
      </div>
    </div>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    user_id: "demo-user",
    goals: [],
    domains: [],
    preferred_tone: "neutral",
    detail: "standard",
    output_formats: ["markdown"],
    style_notes: "",
    cognitive: {
      divergent: 50,
      big_picture: 50,
      speed_over_evidence: 50,
      risk_tolerance: 50,
      visual_pref: 50
    },
    constraints: {},
    step_by_step: true,
    wants_citations: false
  });

  const toggleArrayItem = (arr: string[], item: string) => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = async () => {
    // Save to localStorage
    localStorage.setItem("tp_profile", JSON.stringify(profile));
    
    // Optionally save to backend
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
    } catch (err) {
      console.log("Profile saved locally only");
    }
    
    router.push("/");
  };

  return (
    <div className="onboarding-wizard">
      <div className="progress-bar" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: i <= step ? "var(--accent)" : "var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: i <= step ? "white" : "var(--muted)",
                fontWeight: 600
              }}
            >
              {i}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="step-content">
          <h3>What do you want to do? 🎯</h3>
          <p style={{ marginBottom: 20, color: "var(--muted)" }}>Select your goals and domains of interest</p>
          
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 12, fontSize: 14 }}>Goals</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {GOALS.map(goal => (
                <label key={goal} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={profile.goals.includes(goal)}
                    onChange={() => setProfile({ ...profile, goals: toggleArrayItem(profile.goals, goal) })}
                  />
                  <span>{goal}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 12, fontSize: 14 }}>Domains</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {DOMAINS.map(domain => (
                <label key={domain} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={profile.domains.includes(domain)}
                    onChange={() => setProfile({ ...profile, domains: toggleArrayItem(profile.domains, domain) })}
                  />
                  <span>{domain}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="step-content">
          <h3>How should we think? 🧠</h3>
          <p style={{ marginBottom: 20, color: "var(--muted)" }}>Adjust these sliders to match your cognitive preferences</p>
          
          {COGNITIVE_DIMENSIONS.map(dim => (
            <Slider
              key={dim.key}
              value={profile.cognitive[dim.key as keyof typeof profile.cognitive]}
              onChange={(value) => setProfile({
                ...profile,
                cognitive: { ...profile.cognitive, [dim.key]: value }
              })}
              label={dim.label}
              low={dim.low}
              high={dim.high}
              tooltip={dim.tooltip}
            />
          ))}

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24 }}>
            <input
              type="checkbox"
              checked={profile.step_by_step}
              onChange={(e) => setProfile({ ...profile, step_by_step: e.target.checked })}
            />
            <span>Prefer step-by-step explanations</span>
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="step-content">
          <h3>How should we write? ✍️</h3>
          <p style={{ marginBottom: 20, color: "var(--muted)" }}>Set your writing and output preferences</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Tone</label>
              <select
                value={profile.preferred_tone}
                onChange={(e) => setProfile({ ...profile, preferred_tone: e.target.value as any })}
                style={{ width: "100%" }}
              >
                <option value="professional">Professional</option>
                <option value="neutral">Neutral</option>
                <option value="friendly">Friendly</option>
                <option value="playful">Playful</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Detail Level</label>
              <select
                value={profile.detail}
                onChange={(e) => setProfile({ ...profile, detail: e.target.value as any })}
                style={{ width: "100%" }}
              >
                <option value="ultra_brief">Ultra Brief</option>
                <option value="brief">Brief</option>
                <option value="standard">Standard</option>
                <option value="in_depth">In Depth</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 12, fontSize: 14 }}>Output Formats</h4>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {OUTPUT_FORMATS.map(format => (
                <label
                  key={format.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 20,
                    cursor: "pointer",
                    background: profile.output_formats.includes(format.id) ? "var(--accent)" : "transparent",
                    color: profile.output_formats.includes(format.id) ? "white" : "var(--text)"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={profile.output_formats.includes(format.id)}
                    onChange={() => setProfile({
                      ...profile,
                      output_formats: toggleArrayItem(profile.output_formats, format.id)
                    })}
                    style={{ display: "none" }}
                  />
                  {format.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Style Notes (optional)</label>
            <textarea
              value={profile.style_notes || ""}
              onChange={(e) => setProfile({ ...profile, style_notes: e.target.value })}
              placeholder="Any specific style preferences..."
              style={{ width: "100%", minHeight: 60 }}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={profile.wants_citations}
              onChange={(e) => setProfile({ ...profile, wants_citations: e.target.checked })}
            />
            <span>Include citations and sources</span>
          </label>
        </div>
      )}

      {step === 4 && (
        <div className="step-content">
          <h3>Review & Save 📋</h3>
          <p style={{ marginBottom: 20, color: "var(--muted)" }}>Review your preferences</p>
          
          <div className="profile-preview" style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 16,
            fontSize: 13,
            lineHeight: 1.6,
            maxHeight: 400,
            overflow: "auto"
          }}>
            <pre>{JSON.stringify(profile, null, 2)}</pre>
          </div>

          <p style={{ marginTop: 16, fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
            💾 Your preferences are stored locally. We don't collect any personal data.
          </p>
        </div>
      )}

      <div className="wizard-actions" style={{ display: "flex", gap: 12, marginTop: 24 }}>
        {step > 1 && (
          <button onClick={handleBack} style={{ background: "var(--border)" }}>
            ← Back
          </button>
        )}
        {step < 4 ? (
          <button onClick={handleNext} style={{ marginLeft: "auto" }}>
            Next →
          </button>
        ) : (
          <button onClick={handleSave} style={{ marginLeft: "auto", background: "var(--accent)" }}>
            Save & Start 🚀
          </button>
        )}
      </div>
    </div>
  );
}