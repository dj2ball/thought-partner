from fastapi import APIRouter, HTTPException
from ..models_user import UserProfile
import json, pathlib

router = APIRouter(prefix="/profile", tags=["profile"])
STORE = pathlib.Path("profiles"); STORE.mkdir(exist_ok=True)

@router.get("/{user_id}")
def get_profile(user_id: str):
    p = STORE / f"{user_id}.json"
    if not p.exists():
        raise HTTPException(404, "Profile not found")
    return json.loads(p.read_text(encoding="utf-8"))

@router.post("")
def upsert_profile(profile: UserProfile):
    p = STORE / f"{profile.user_id}.json"
    p.write_text(profile.model_dump_json(indent=2), encoding="utf-8")
    return profile.model_dump()