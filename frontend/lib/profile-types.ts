export type Tone = "professional" | "neutral" | "friendly" | "playful";
export type Detail = "ultra_brief" | "brief" | "standard" | "in_depth";

export interface CognitiveStyle {
  divergent: number;
  big_picture: number;
  speed_over_evidence: number;
  risk_tolerance: number;
  visual_pref: number;
}

export interface UserProfile {
  user_id: string;
  goals: string[];
  domains: string[];
  preferred_tone: Tone;
  detail: Detail;
  output_formats: string[];
  style_notes?: string;
  cognitive: CognitiveStyle;
  constraints: Record<string, string>;
  step_by_step: boolean;
  wants_citations: boolean;
}