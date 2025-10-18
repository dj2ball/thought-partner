"use client";
import type { Recipe } from "@/lib/types";
import { useState, useMemo } from "react";

function getPatternType(recipe: Recipe): string {
  if (recipe.workflow?.type) {
    return recipe.workflow.type;
  }
  // Fallback to run_mode for legacy recipes
  return recipe.run_mode === "iterative" ? "iterative" : "single_shot";
}

function getComplexityClass(complexity?: string): string {
  switch (complexity) {
    case 'beginner': return 'complexity-beginner';
    case 'intermediate': return 'complexity-intermediate';
    case 'advanced': return 'complexity-advanced';
    default: return 'complexity-beginner';
  }
}

export function RecipeDrawer({ recipes }: { recipes: Recipe[] }) {
  const [q, setQ] = useState("");
  const [filterPattern, setFilterPattern] = useState<string>("");
  const [filterComplexity, setFilterComplexity] = useState<string>("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return recipes.filter(r => {
      // Text search
      const matchesText = !s || r.name.toLowerCase().includes(s) || r.description.toLowerCase().includes(s);
      
      // Pattern filter
      const pattern = getPatternType(r);
      const matchesPattern = !filterPattern || pattern === filterPattern;
      
      // Complexity filter
      const complexity = r.meta?.complexity;
      const matchesComplexity = !filterComplexity || complexity === filterComplexity;
      
      return matchesText && matchesPattern && matchesComplexity;
    });
  }, [q, recipes, filterPattern, filterComplexity]);

  const patterns = useMemo(() => {
    const patternSet = new Set(recipes.map(getPatternType));
    return Array.from(patternSet).sort();
  }, [recipes]);

  const complexities = ['beginner', 'intermediate', 'advanced'];

  return (
    <div className="recipe-list">
      <div style={{display:"flex", flexDirection:"column", gap:8, marginBottom:12}}>
        <input 
          placeholder="Search recipes…" 
          value={q} 
          onChange={e=>setQ(e.target.value)} 
          style={{flex:1}}
        />
        <div style={{display:"flex", gap:8}}>
          <select 
            value={filterPattern} 
            onChange={e=>setFilterPattern(e.target.value)}
            style={{flex:1, fontSize:12}}
          >
            <option value="">All Patterns</option>
            {patterns.map(pattern => (
              <option key={pattern} value={pattern}>
                {pattern.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select 
            value={filterComplexity} 
            onChange={e=>setFilterComplexity(e.target.value)}
            style={{flex:1, fontSize:12}}
          >
            <option value="">All Levels</option>
            {complexities.map(level => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {filtered.map(r => {
        const pattern = getPatternType(r);
        const complexity = r.meta?.complexity || 'beginner';
        
        return (
          <div key={r.id} className="recipe-item">
            <div className="pattern-indicator">
              {pattern.replace('_', ' ')}
            </div>
            <h4>{r.name}</h4>
            
            <div className="recipe-meta">
              <span className={`complexity-badge ${getComplexityClass(complexity)}`}>
                {complexity}
              </span>
              {r.meta?.time_estimate && (
                <span className="time-estimate">⏱ {r.meta.time_estimate}</span>
              )}
            </div>
            
            <p>{r.description}</p>
            
            {r.meta?.tags && r.meta.tags.length > 0 && (
              <div className="recipe-tags">
                {r.meta.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
            
            {r.meta?.works_well_with && r.meta.works_well_with.length > 0 && (
              <div style={{marginTop:8, fontSize:11, color:'var(--muted)'}}>
                Works well with: {r.meta.works_well_with.join(', ')}
              </div>
            )}
          </div>
        );
      })}
      
      {filtered.length === 0 && (
        <div style={{textAlign:'center', color:'var(--muted)', padding:20}}>
          No recipes found matching your criteria
        </div>
      )}
    </div>
  );
}