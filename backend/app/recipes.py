import json, pathlib
from .models import Recipe

RECIPES: dict[str, Recipe] = {}

def load_recipes(path: str | pathlib.Path):
    global RECIPES
    try:
        data = json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
        RECIPES = { r["id"]: Recipe(**r) for r in data }
        print(f"Loaded {len(RECIPES)} recipes successfully")
    except Exception as e:
        print(f"Error loading recipes: {e}")

def list_recipes():
    return [r for r in RECIPES.values()]

# Auto-load recipes on module import
try:
    load_recipes("brainstorm_recipes.json")
except Exception as e:
    print(f"Could not auto-load recipes: {e}")