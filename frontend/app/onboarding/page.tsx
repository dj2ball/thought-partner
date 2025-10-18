"use client";
import { OnboardingWizard } from "@/components/OnboardingWizard";

export default function Onboarding() {
  return (
    <main className="main" style={{gridTemplateColumns:"1fr"}}>
      <section className="chat" style={{maxWidth:800, margin:"0 auto", padding: "24px 16px"}}>
        <div className="card" style={{ padding: 32 }}>
          <OnboardingWizard />
        </div>
      </section>
    </main>
  );
}