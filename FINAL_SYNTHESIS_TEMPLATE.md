# Final Synthesis Framework - Reusable Template

The final synthesis functionality is now **fully generic** and can be added to any iterative recipe. Here's how:

## 🏗️ Architecture

### **Core Components:**
1. **Generic iteration summarizer** - Works with any recipe structure
2. **Specialized format builders** - For domain-specific summaries  
3. **Flexible prompt templating** - Supports any synthesis approach
4. **Configurable response schemas** - Define your own output structure

## 📋 How to Add to Any Recipe

### **1. Add to Recipe JSON:**
```json
{
  "iterative": {
    "final_synthesis": {
      "enabled": true,
      "summary_builder": "generic|debate_format|research_format|custom",
      "prompt": "Your synthesis prompt with {placeholders}",
      "response_schema": { /* Your JSON schema */ }
    }
  }
}
```

### **2. Available Summary Builders:**

#### **`"generic"`** (Default)
- Works with any recipe structure
- Extracts meaningful content from any output format
- Looks for common patterns: `title`, `description`, `findings`, etc.

#### **`"debate_format"`**
- Specialized for multi-agent debates
- Recognizes: Optimist proposals, Skeptic critiques, Mediator synthesis
- Formats with appropriate emojis and structure

#### **`"research_format"`**
- Specialized for research workflows
- Recognizes: findings, insights, research phases
- Academic/analytical formatting

### **3. Prompt Placeholders:**
- `{problem}` - Main input parameter
- `{iteration_summary}` - Formatted summary of all iterations
- `{final_state}` - JSON of final state
- `{any_param}` - Any parameter from the original request

## 🎯 Example Use Cases

### **Research Recipe:**
```json
{
  "id": "iterative_research",
  "name": "Deep Research Assistant",
  "iterative": {
    "substeps": [
      {"role": "Researcher", "prompt": "Research aspect {loop} of {topic}..."},
      {"role": "Analyzer", "prompt": "Analyze findings for patterns..."}
    ],
    "final_synthesis": {
      "enabled": true,
      "summary_builder": "research_format",
      "prompt": "Review research on {topic}:\n{iteration_summary}\n\nCreate comprehensive research report...",
      "response_schema": {
        "type": "object",
        "properties": {
          "research_summary": {"type": "string"},
          "key_findings": {"type": "array"},
          "methodology_assessment": {"type": "string"},
          "future_research_directions": {"type": "array"}
        },
        "additionalProperties": false
      }
    }
  }
}
```

### **Creative Brainstorm Recipe:**
```json
{
  "id": "creative_expansion",
  "name": "Creative Idea Expander",
  "iterative": {
    "substeps": [
      {"role": "Ideator", "prompt": "Generate {loop} creative variations of {concept}..."},
      {"role": "Evaluator", "prompt": "Rate feasibility and originality..."}
    ],
    "final_synthesis": {
      "enabled": true,
      "summary_builder": "generic",
      "prompt": "Review creative session for {concept}:\n{iteration_summary}\n\nCreate final creative brief...",
      "response_schema": {
        "type": "object",
        "properties": {
          "creative_brief": {"type": "string"},
          "top_concepts": {"type": "array"},
          "implementation_roadmap": {"type": "array"}
        },
        "additionalProperties": false
      }
    }
  }
}
```

### **Strategic Planning Recipe:**
```json
{
  "id": "strategic_planning",
  "name": "Multi-Phase Strategy Development",
  "iterative": {
    "substeps": [
      {"role": "Analyst", "prompt": "Analyze {domain} landscape in phase {loop}..."},
      {"role": "Strategist", "prompt": "Develop strategic options..."},
      {"role": "Evaluator", "prompt": "Assess strategic fit and risk..."}
    ],
    "final_synthesis": {
      "enabled": true,
      "summary_builder": "generic",
      "prompt": "Synthesize strategic analysis for {domain}:\n{iteration_summary}\n\nCreate executive strategic plan...",
      "response_schema": {
        "type": "object",
        "properties": {
          "strategic_overview": {"type": "string"},
          "recommended_strategy": {"type": "object"},
          "risk_assessment": {"type": "array"},
          "implementation_timeline": {"type": "array"}
        },
        "additionalProperties": false
      }
    }
  }
}
```

## 🔧 Custom Summary Builders

To add a new specialized format:

1. **Add to runner.py:**
```python
elif summary_builder == "your_format":
    iteration_summary = _create_your_format_summary(history)
```

2. **Implement function:**
```python
def _create_your_format_summary(history: list) -> str:
    """Specialized summary for your domain"""
    # Your custom logic here
    return formatted_summary
```

## 🎨 Benefits

### **For Recipe Creators:**
- ✅ **Plug-and-play** - Add to any iterative recipe
- ✅ **Flexible** - Define your own synthesis approach
- ✅ **Consistent** - Same framework across all recipes

### **For Users:**
- ✅ **Always get conclusions** - No more "what should I do now?"
- ✅ **Domain-appropriate output** - Research reports, creative briefs, strategic plans
- ✅ **Actionable results** - Structured next steps

The final synthesis framework transforms any iterative recipe from a **process** into a **complete solution**! 🚀