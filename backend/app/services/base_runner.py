from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from ..models import Recipe
from ..models_user import UserProfile


class BaseRunner(ABC):
    """Abstract base class for all recipe runners"""
    
    def __init__(self, profile: Optional[UserProfile] = None):
        self.profile = profile

    @abstractmethod
    async def run(self, recipe: Recipe, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the recipe with given inputs and return results"""
        pass

    def build_system_prompt(self, base_prompt: str) -> str:
        """Inject profile preferences into system prompt"""
        if not self.profile:
            return base_prompt
        
        profile_context = (
            "User Preferences:\n"
            f"- Goals: {', '.join(self.profile.goals)}\n"
            f"- Domains: {', '.join(self.profile.domains)}\n"
            f"- Tone: {self.profile.preferred_tone}; Detail: {self.profile.detail}\n"
            f"- Output formats: {', '.join(self.profile.output_formats)}\n"
            f"- Cognitive: div={self.profile.cognitive.divergent}, big={self.profile.cognitive.big_picture}, "
            f"speed={self.profile.cognitive.speed_over_evidence}, risk={self.profile.cognitive.risk_tolerance}, visual={self.profile.cognitive.visual_pref}\n"
            f"- Step-by-step: {self.profile.step_by_step}; Citations: {self.profile.wants_citations}\n"
            f"- Constraints: {self.profile.constraints}\n"
            f"- Notes: {self.profile.style_notes or '—'}\n"
            "Follow these when applying any recipe.\n\n"
        )
        
        return profile_context + base_prompt

    def safe_template_replace(self, template: str, params: Dict[str, Any]) -> str:
        """Safely replace template variables avoiding JSON conflicts"""
        result = template
        for key, value in params.items():
            placeholder = f"{{{key}}}"
            if placeholder in result:
                result = result.replace(placeholder, str(value))
        return result