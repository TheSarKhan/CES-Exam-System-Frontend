import React from "react";

export default function ExamTokenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-secondary)" }}>
      <header
        style={{
          height: "56px",
          background: "var(--bg-primary)",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          padding: "0 2rem",
        }}
      >
        <span style={{ fontWeight: 700, color: "var(--primary-color)" }}>CES Assessment</span>
      </header>
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1.5rem" }}>{children}</main>
    </div>
  );
}
