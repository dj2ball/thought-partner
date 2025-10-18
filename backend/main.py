from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.recipes import load_recipes
from app.routers import recipes, run, profile

app = FastAPI(title="Thought Partner API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_recipes("brainstorm_recipes.json")
app.include_router(recipes.router)
app.include_router(run.router)
app.include_router(profile.router)

@app.get("/")
def root():
    return {"ok": True, "routes": ["/recipes", "/run", "/profile"]}