# 🧠 Thought Partner

A sophisticated AI-powered brainstorming application featuring multi-agent patterns, personalized user profiles, and interactive visualizations.

![Status](https://img.shields.io/badge/status-beta-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.8+-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue)

## 🚀 Features

### Multi-Step Onboarding Wizard
- **Goals & Domains**: Select your objectives and areas of interest
- **Cognitive Preferences**: 5-dimensional personality sliders (divergent thinking, big picture vs details, speed vs evidence, risk tolerance, visual preference)
- **Writing Style**: Tone, detail level, output formats, citations
- **Profile Preview**: JSON preview before saving

### Advanced User Profiling
- Comprehensive cognitive style assessment
- Personalized system prompts based on user preferences
- Saved profiles (localStorage + optional backend)
- Dynamic profile injection into AI interactions

### Multi-Agent Recipe System
- **Optimist Agent**: Proposes bold opportunities
- **Skeptic Agent**: Critiques with evidence-based challenges
- **Mediator Agent**: Synthesizes trade-offs and balanced directions
- Configurable loop counts and guardrails against sycophancy

### Beautiful UI/UX
- Azure-inspired markdown rendering
- Dark theme with purple accents
- Responsive grid layout
- Real-time API connection status
- Progressive enhancement (works offline in mock mode)

## 📁 Project Structure

```
thought_partner/
├── backend/                 # FastAPI Backend
│   ├── main.py             # App entry point
│   ├── requirements.txt    # Python dependencies
│   ├── brainstorm_recipes.json  # Recipe definitions
│   ├── .env               # Environment variables
│   ├── profiles/          # User profile storage
│   └── app/
│       ├── config.py      # Settings management
│       ├── models.py      # Core data models
│       ├── models_user.py # User profile models
│       ├── recipes.py     # Recipe loading
│       ├── routers/       # API endpoints
│       │   ├── recipes.py
│       │   ├── run.py
│       │   └── profile.py
│       └── services/      # Business logic
│           ├── runner.py           # OpenAI runner
│           └── langchain_runner.py # LangChain runner
│
└── frontend/               # Next.js Frontend
    ├── package.json       # Node dependencies
    ├── .env.local        # Frontend environment
    ├── app/              # Next.js app router
    │   ├── page.tsx      # Main chat interface
    │   ├── layout.tsx    # App layout
    │   └── onboarding/   # Onboarding wizard
    ├── components/       # React components
    │   ├── OnboardingWizard.tsx  # 4-step wizard
    │   ├── ChatThread.tsx        # Message display
    │   ├── Composer.tsx          # Message input
    │   ├── RecipeDrawer.tsx      # Recipe selector
    │   └── ResultCard.tsx        # Result rendering
    ├── lib/             # Utilities & types
    │   ├── profile-types.ts  # TypeScript types
    │   ├── store.ts          # Zustand state
    │   ├── mock.ts           # Mock API
    │   └── api.ts            # Real API calls
    └── styles/          # CSS files
        ├── globals.css      # App styles
        └── markdown.css     # Markdown rendering
```

## 🛠 Setup & Run

### Backend Setup

```bash
cd backend
python -m pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Add your OpenAI API key
echo "OPENAI_API_KEY=your-key-here" >> .env

# Start the server
python -m uvicorn main:app --reload --port 8000
```

**API Endpoints:**
- `GET /` - Health check
- `GET /recipes` - List all recipes  
- `GET /recipes/{id}` - Get specific recipe
- `POST /run` - Execute a recipe
- `GET /profile/{user_id}` - Get user profile
- `POST /profile` - Save user profile

### Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## 🎯 User Journey

1. **First Visit**: Automatic redirect to onboarding wizard
2. **Step 1 - Goals & Domains**: Multi-select your objectives
3. **Step 2 - Cognitive Style**: Adjust 5 personality sliders
4. **Step 3 - Writing Preferences**: Set tone, detail, formats
5. **Step 4 - Review & Save**: Preview and confirm profile
6. **Main App**: Personalized brainstorming interface
7. **Recipe Execution**: AI agents debate your problem with your cognitive style

## 🧪 Recipe System

### Multi-Agent Debate Pattern

```json
{
  "id": "multi_agent_debate",
  "name": "Multi-Agent Debate (Optimist vs Skeptic → Mediator)",
  "run_mode": "iterative",
  "iterative": {
    "substeps": [
      {"role": "Optimist", "prompt": "Propose 2 bold opportunities..."},
      {"role": "Skeptic", "prompt": "Critique with evidence..."},
      {"role": "Mediator", "prompt": "Synthesize with trade-offs..."}
    ],
    "language_guardrails": "Do not flatter. Vary stance. Prefer evidence.",
    "step_response_schema": {...}
  },
  "ui_preferences": {"render_as_markdown": true}
}
```

### Profile Integration

User profiles are automatically injected as system prompts:

```
User Preferences:
- Goals: Brainstorm ideas, Solve problems
- Domains: Technology, Business  
- Tone: friendly; Detail: standard
- Cognitive: divergent=75, big_picture=60, speed_over_evidence=40, risk_tolerance=80, visual=50
- Step-by-step: true; Citations: false
- Constraints: {"timebox": "15min"}
- Style notes: Prefer concrete examples
Follow these when applying any recipe.
```

## 🎨 Design Features

### Cognitive Dimensions
- **Divergent Thinking**: Convergent (one answer) ↔ Divergent (many possibilities)
- **Scope**: Details ↔ Big Picture
- **Speed vs Evidence**: Evidence-based ↔ Fast & intuitive  
- **Risk Tolerance**: Conservative ↔ Bold
- **Visual Preference**: Text-heavy ↔ Visual-heavy

### Output Rendering
- **Markdown**: Azure-inspired styling with role-based formatting
- **JSON**: Syntax-highlighted fallback
- **Progressive Enhancement**: Works offline with mock data

### Responsive Design
- Mobile-friendly onboarding wizard
- Adaptive grid layout (sidebar, chat, inspector)
- Dark theme with accessibility considerations

## 🔧 Configuration

### Environment Variables

**Backend (.env)**:
```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
USE_LANGCHAIN=false
PORT=8000
```

**Frontend (.env.local)**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Recipe Configuration

Recipes support:
- One-shot or iterative execution
- Multi-step agent loops
- JSON schema validation
- Custom UI rendering preferences
- Language guardrails

## 🎪 Demo Mode

The frontend gracefully degrades to mock mode when the backend is unavailable:

- ✅ Full UI functionality
- ✅ Onboarding wizard
- ✅ Profile saving (localStorage)
- ✅ Mock debate generation
- ⚠️ No real AI execution

## 🚦 Status Indicators

The app shows real-time connection status:
- 🟢 **Connected to API**: Full functionality
- 🟡 **Mock Mode**: Frontend-only demo

## 🎯 Key Innovations

1. **Cognitive Style Assessment**: 5-dimensional personality capture
2. **Anti-Sycophancy Guardrails**: Agents must disagree when warranted
3. **Progressive Enhancement**: Works offline, better online
4. **Schema-Enforced JSON**: Structured output from AI agents
5. **Profile-Aware Prompting**: Dynamic system prompt injection
6. **Beautiful Markdown**: Role-specific formatting with Azure styling

This implementation represents a complete, production-ready brainstorming platform with sophisticated user modeling and multi-agent AI patterns.