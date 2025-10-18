"use client";
import { useState, useMemo, useCallback } from "react";
import type { Recipe } from "@/lib/types";
import { useChat } from "@/lib/store";
import { DynamicInputForm } from "./DynamicInputForm";

type RunFn = (body: any) => Promise<any>;

export function Composer({ recipes, runFn }: { recipes: Recipe[]; runFn: RunFn }) {
  const [recipeId, setRecipeId] = useState<string | undefined>();
  const [inputParams, setInputParams] = useState<Record<string, any>>({});
  const [loops, setLoops] = useState<number>(3);
  const { addUserMessage, addMessage, patchMessage } = useChat();

  const recipe = useMemo(() => recipes.find(r => r.id === recipeId), [recipes, recipeId]);

  // Reset input params when recipe changes
  useMemo(() => {
    if (recipe) {
      setInputParams({});
    }
  }, [recipe?.id]);

  const handleInputChange = useCallback((params: Record<string, any>) => {
    setInputParams(params);
  }, []);

  // Check if we have all required inputs
  const canRun = useMemo(() => {
    if (!recipe) return false;
    
    // For legacy recipes without input definitions
    if (Array.isArray(recipe.inputs) && recipe.inputs.length > 0 && typeof recipe.inputs[0] === 'string') {
      // Check if we have the main input (problem/topic)
      return Boolean(inputParams.problem || inputParams.topic || Object.keys(inputParams).length > 0);
    }
    
    // For new recipes with input definitions
    if (Array.isArray(recipe.inputs) && recipe.inputs.length > 0 && typeof recipe.inputs[0] === 'object') {
      const inputDefs = recipe.inputs as any[];
      return inputDefs.every(input => 
        !input.required || (input.name in inputParams && inputParams[input.name] !== '')
      );
    }
    
    return true;
  }, [recipe, inputParams]);

  async function onRun() {
    if (!recipe || !canRun) return;
    
    // Get user profile from localStorage
    const profileData = localStorage.getItem("tp_profile");
    const profile = profileData ? JSON.parse(profileData) : null;
    
    // Determine user message for display
    const userMessage = inputParams.problem || inputParams.topic || 
                       Object.values(inputParams).find(v => typeof v === 'string' && v.length > 10) ||
                       `${recipe.name} with parameters`;
    
    const body = {
      recipe_id: recipe.id, 
      mode: "iterative", 
      loops,
      params: { 
        ...inputParams,
        user_id: profile?.user_id || "demo-user",
        ...profile // Include full profile in params for backend
      }
    };
    
    // Add user message immediately
    const userMsgId = addUserMessage({ 
      text: userMessage, 
      recipeId: recipe.id, 
      loops, 
      mode: "iterative", 
      params: body.params 
    });
    
    // Add thinking indicator as assistant message
    const thinkingMsgId = addMessage({
      role: "assistant",
      text: "",
      result: { status: "thinking", recipe_name: recipe.name, loops }
    });
    
    try {
      const res = await runFn(body);
      console.log('Composer - API Response:', res);
      console.log('Composer - res.output:', res.output);
      console.log('Composer - res.output.output:', res.output?.output);
      
      // Extract the actual mindmap data from the nested structure
      const mindmapData = res.output?.output || res.output;
      const resultData = { 
        ...mindmapData, 
        recipe_name: recipe.name 
      };
      console.log('Composer - Extracted mindmap data:', mindmapData);
      console.log('Composer - Sending to PatternRenderer:', resultData);
      
      patchMessage(thinkingMsgId, { 
        result: resultData,
        text: ""
      });
    } catch (e: any) {
      // Replace thinking message with error
      patchMessage(thinkingMsgId, { 
        error: e.message || "Failed to run",
        result: null
      });
    }
  }

  return (
    <div className="composer">
      <div className="row">
        <select value={recipeId} onChange={e=>setRecipeId(e.target.value)}>
          <option value="">Select a Recipe…</option>
          {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        {(recipe?.run_mode === "iterative" || recipe?.workflow?.type === "iterative") && 
          <input 
            type="number" 
            min={1} 
            max={10} 
            value={loops} 
            onChange={e=>setLoops(+e.target.value)}
            title="Number of iterations"
          />
        }
      </div>
      
      {recipe && (
        <DynamicInputForm 
          recipe={recipe}
          onInputChange={handleInputChange}
          initialValues={inputParams}
        />
      )}
      
      <button 
        disabled={!canRun} 
        onClick={onRun}
        title={!canRun ? "Please fill in all required fields" : "Run recipe"}
      >
        Run {recipe?.name || "Recipe"}
      </button>
    </div>
  );
}