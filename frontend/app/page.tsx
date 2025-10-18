"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listMockRecipes, mockRun } from "@/lib/mock";
import { fetchRecipes, realRun } from "@/lib/api";
import type { Recipe } from "@/lib/types";
import { Composer } from "@/components/Composer";
import { RecipeDrawer } from "@/components/RecipeDrawer";
import { ChatThread } from "@/components/ChatThread";

export default function Page() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiMode, setApiMode] = useState<"mock" | "real">("mock");
  const router = useRouter();
  
  useEffect(() => {
    async function initApp() {
      // Check if user has completed onboarding
      const profile = localStorage.getItem("tp_profile");
      if (!profile) {
        router.push("/onboarding");
        return;
      }

      // Try to fetch recipes from real API first
      try {
        const realRecipes = await fetchRecipes();
        setRecipes(realRecipes);
        setApiMode("real");
      } catch (error) {
        console.log("API not available, using mock mode");
        setRecipes(listMockRecipes());
        setApiMode("mock");
      }
      
      setLoading(false);
    }

    initApp();
  }, [router]);
  
  if (loading) {
    return <div className="main" style={{display:"flex", alignItems:"center", justifyContent:"center"}}>Loading...</div>;
  }
  
  const runFn = apiMode === "real" ? realRun : mockRun;
  
  return (
    <main className="main">
      <aside className="sidebar"><RecipeDrawer recipes={recipes} /></aside>
      <section className="chat">
        <ChatThread />
        <Composer recipes={recipes} runFn={runFn} />
      </section>
      <aside className="inspector">
        <div className="card">
          <b>System Status</b>
          <p style={{ margin: "8px 0", fontSize: 12 }}>
            Mode: <span style={{ color: apiMode === "real" ? "#4CAF50" : "#FF9800" }}>
              {apiMode === "real" ? "🟢 Connected to API" : "🟡 Mock Mode"}
            </span>
          </p>
          <p style={{ fontSize: 11, color: "var(--muted)" }}>
            {apiMode === "mock" ? "Start the backend server to enable full functionality" : "Backend connected successfully"}
          </p>
        </div>
      </aside>
    </main>
  );
}