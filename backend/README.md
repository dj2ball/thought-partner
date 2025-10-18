# Thought Partner API (Dev-Ready)

## Run
```bash
pip install -r requirements.txt
cp .env.example .env
# set OPENAI_API_KEY (and USE_LANGCHAIN=true to try LC runner)
uvicorn main:app --reload --port 8000
```

## Endpoints
- GET /recipes
- GET /recipes/{id}
- POST /run — { "recipe_id": "...", "mode": "iterative|one-shot|auto", "loops": 3, "params": { "problem": "...", "user_id": "demo-user" } }
- POST /profile — body: UserProfile
- GET /profile/{user_id}

When a recipe sets:

```json
"ui_preferences": { "render_as_markdown": true }
```

the server adds a markdown field to iterative outputs for easy UI rendering.