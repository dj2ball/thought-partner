from fastapi import APIRouter, HTTPException
from ..recipes import list_recipes, RECIPES

router = APIRouter(prefix="/recipes", tags=["recipes"])

@router.get("")
def get_all():
    return {"recipes": [r.model_dump() for r in list_recipes()]}

@router.get("/{recipe_id}")
def get_one(recipe_id: str):
    if recipe_id not in RECIPES:
        raise HTTPException(404, "Recipe not found")
    return RECIPES[recipe_id].model_dump()