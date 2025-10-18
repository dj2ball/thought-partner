# Pattern Rendering System Guide

## 🎨 **Overview**

The Pattern Rendering System automatically selects the most appropriate visualization for each recipe output, preserving the unique value and usability of different ideation techniques.

## 🏗️ **Architecture**

### **Smart Routing Logic (3-Level Detection)**

1. **Recipe Name Detection** - Recognizes specific recipe types by name keywords
2. **Data Structure Detection** - Analyzes result structure to auto-select renderer  
3. **Pattern Fallback** - Uses runner type as final fallback

### **Routing Flow**
```typescript
recipeName.includes('mind map') → MindMapRenderer
recipeName.includes('crazy 8') → GridRenderer
result?.timeline → TimelineRenderer  
result?.matrix → MatrixRenderer
pattern === 'iterative' → IterativeDebateRenderer
default → DefaultRenderer
```

## 🎭 **Available Renderers**

### **1. MindMapRenderer**
**Use Cases**: Mind mapping, hierarchical exploration
**Data Structure**: 
```json
{
  "central_topic": "Topic Name",
  "main_branches": [
    {
      "name": "Branch Name",
      "color": "#color",
      "sub_branches": [
        {
          "name": "Sub-branch",
          "details": ["detail1", "detail2"],
          "connections": ["other-branch"]
        }
      ]
    }
  ],
  "key_insights": ["insight1"],
  "cross_connections": [
    {"from": "A", "to": "B", "relationship": "influences"}
  ]
}
```
**Visual Features**: 
- Hierarchical tree structure
- Color-coded branches
- Connection indicators
- Key insights highlighting

---

### **2. TimelineRenderer**  
**Use Cases**: Futuring backwards, storyboarding, sequential processes
**Data Structure**:
```json
{
  "timeline": [
    {
      "title": "Step Name",
      "timeframe": "Q1 2024", 
      "description": "Step description",
      "actions": ["action1", "action2"]
    }
  ],
  "insights": "Overall insights"
}
```
**Visual Features**:
- Numbered timeline markers
- Timeframe indicators
- Action lists
- Linear progression visualization

---

### **3. MatrixRenderer**
**Use Cases**: Morphological matrix, dimensional analysis, combinations
**Data Structure**:
```json
{
  "dimensions": [
    {
      "name": "Dimension 1",
      "values": ["option1", "option2"]
    }
  ],
  "combinations": [
    {
      "name": "Combination A",
      "score": 8.5,
      "parameters": {"dim1": "value1", "dim2": "value2"},
      "description": "Analysis"
    }
  ],
  "recommendations": "Best combinations"
}
```
**Visual Features**:
- Dimension overview
- Grid-based combination display
- Scoring indicators
- Parameter breakdown

---

### **4. ClusterRenderer**
**Use Cases**: Affinity mapping, brain netting, idea clustering
**Data Structure**:
```json
{
  "clusters": [
    {
      "name": "Cluster Name",
      "count": 5,
      "items": ["idea1", "idea2"],
      "theme": "Main theme",
      "insights": "Cluster insights"
    }
  ],
  "connections": [
    {"from": "Cluster A", "to": "Cluster B", "relationship": "related"}
  ]
}
```
**Visual Features**:
- Card-based cluster layout
- Item count badges
- Theme identification
- Inter-cluster connections

---

### **5. GridRenderer**
**Use Cases**: Crazy 8s, rapid ideation, brainwriting
**Data Structure**:
```json
{
  "concepts": [
    {
      "title": "Concept Name",
      "description": "Brief description",
      "sketch": "ASCII art or description",
      "tags": ["tag1", "tag2"]
    }
  ],
  "selected_concepts": [
    {"title": "Best Concept", "reason": "Why selected"}
  ]
}
```
**Visual Features**:
- Grid layout with numbered cards
- Concept sketches/descriptions
- Tag display
- Selected concept highlighting

---

### **6. TreeRenderer**
**Use Cases**: Lotus blossom, starbursting, recursive expansion
**Data Structure**:
```json
{
  "tree": {
    "name": "Root Node",
    "description": "Root description",
    "children": [
      {
        "name": "Child Node",
        "details": "Expanded details",
        "children": [...]
      }
    ]
  },
  "insights": "Expansion insights"
}
```
**Visual Features**:
- Recursive tree structure
- Level-based indentation  
- Color-coded levels (purple, green, yellow, red)
- Expandable details

---

### **7. PersonaRenderer**
**Use Cases**: Role storming, synectics, perspective analysis
**Data Structure**:
```json
{
  "personas": [
    {
      "name": "Role Name",
      "emoji": "👤",
      "background": "Role background",
      "viewpoint": "Perspective text",
      "ideas": ["idea1", "idea2"],
      "concerns": ["concern1"]
    }
  ],
  "synthesis": "Combined perspective"
}
```
**Visual Features**:
- Avatar-based persona cards
- Viewpoint sections
- Ideas and concerns lists
- Synthesis summary

---

### **8. IterativeDebateRenderer**
**Use Cases**: Multi-agent debates, iterative discussions  
**Data Structure**:
```json
{
  "process_summary": "How the debate evolved",
  "final_synthesis": "Final conclusions",
  "actionable_recommendations": "Next steps",
  "loop_history": [
    {
      "steps": [
        {"role": "Optimist", "content": "Proposals"},
        {"role": "Skeptic", "content": "Critiques"}
      ]
    }
  ]
}
```
**Visual Features**:
- Process timeline
- Role-based formatting
- Collapsible history
- Action recommendations

---

### **9. ParallelRenderer**
**Use Cases**: Parallel branching, voting patterns
**Data Structure**:
```json
{
  "branches": [
    {
      "branch_name": "Branch 1", 
      "content": "Branch results"
    }
  ],
  "synthesis": "Combined results"
}
```
**Visual Features**:
- Side-by-side branch display
- Synthesis highlighting
- Branch-specific formatting

---

### **10. DefaultRenderer**
**Use Cases**: Fallback for any unmatched patterns
**Features**:
- Markdown rendering for strings
- JSON formatting for objects
- Automatic field detection (final_synthesis, output, etc.)

## 🔧 **Implementation Guide**

### **Adding a New Renderer**

1. **Create Renderer Function**:
```typescript
function MyNewRenderer({ result }: { result: any }) {
  if (!result?.mySpecificField) {
    return <DefaultRenderer result={result} />;
  }
  
  return (
    <div className="my-new-result">
      {/* Custom JSX structure */}
    </div>
  );
}
```

2. **Add CSS Styles**:
```css
.my-new-result {
  /* Custom styling */
}
```

3. **Update Routing Logic**:
```typescript
// In PatternRenderer component
if (lowerRecipeName.includes('my recipe')) {
  return <MyNewRenderer result={result} />;
}

// Or data structure detection
if (result?.mySpecificField) {
  return <MyNewRenderer result={result} />;
}
```

### **Recipe Integration Checklist**

✅ Design expected output JSON structure
✅ Choose appropriate renderer based on output type
✅ Test renderer with sample data
✅ Add recipe name keywords to routing logic
✅ Verify fallback behavior for malformed data

## 🎯 **Best Practices**

### **Data Structure Design**
- Use consistent field names across similar patterns
- Include fallback fields for graceful degradation
- Provide clear data hierarchies
- Add metadata fields for enhanced display

### **Renderer Design**
- Always check for required fields and fallback gracefully
- Use semantic HTML structure for accessibility
- Follow existing dark theme color patterns
- Maintain responsive design principles

### **Performance**
- Avoid deep nesting in render loops
- Use React.memo for expensive renderers
- Lazy load heavy visualization components
- Cache complex calculations

## 📊 **Coverage Matrix**

| Recipe Type | Primary Renderer | Secondary Renderer | Fallback |
|-------------|------------------|-------------------|----------|
| Mind Mapping | MindMapRenderer | TreeRenderer | DefaultRenderer |
| Crazy 8s | GridRenderer | ParallelRenderer | DefaultRenderer |  
| Storyboarding | TimelineRenderer | DefaultRenderer | DefaultRenderer |
| Morphological Matrix | MatrixRenderer | DefaultRenderer | DefaultRenderer |
| Affinity Mapping | ClusterRenderer | DefaultRenderer | DefaultRenderer |
| Role Storming | PersonaRenderer | DefaultRenderer | DefaultRenderer |
| Multi-Agent Debate | IterativeDebateRenderer | DefaultRenderer | DefaultRenderer |
| Parallel Branching | ParallelRenderer | DefaultRenderer | DefaultRenderer |

## 🚀 **Future Enhancements**

### **Interactive Features**
- Clickable mind map nodes for drill-down
- Sortable/filterable cluster items
- Timeline scrubbing for temporal data
- Matrix cell highlighting and comparison

### **Export Capabilities**
- PNG/SVG export for visualizations
- PDF reports with embedded charts
- CSV export for tabular data
- Shareable links for results

### **Animation & Transitions**
- Smooth tree expansion animations
- Timeline progression effects
- Cluster formation animations
- Persona card flip transitions

The Pattern Rendering System ensures that every ideation technique output is displayed in its most meaningful and usable form, enhancing the user experience and preserving the unique value of each creative method.