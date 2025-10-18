import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thought Partner",
  description: "Chat-first ideation with Thinking Recipes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <div className="brand">Thought Partner</div>
            <div className="header-actions"><a className="link" href="/onboarding">Onboarding</a></div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}