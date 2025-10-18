from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict

Tone = Literal["professional","neutral","friendly","playful"]
Detail = Literal["ultra_brief","brief","standard","in_depth"]

class CognitiveStyle(BaseModel):
    divergent: int = Field(50, ge=0, le=100)
    big_picture: int = Field(50, ge=0, le=100)
    speed_over_evidence: int = Field(50, ge=0, le=100)
    risk_tolerance: int = Field(50, ge=0, le=100)
    visual_pref: int = Field(50, ge=0, le=100)

class UserProfile(BaseModel):
    user_id: str
    goals: List[str] = []
    domains: List[str] = []
    preferred_tone: Tone = "neutral"
    detail: Detail = "standard"
    output_formats: List[str] = ["markdown"]
    style_notes: Optional[str] = None
    cognitive: CognitiveStyle = CognitiveStyle()
    constraints: Dict[str, str] = {}
    step_by_step: bool = True
    wants_citations: bool = False