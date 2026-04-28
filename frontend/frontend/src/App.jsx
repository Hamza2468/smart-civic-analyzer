// App.jsx - Root application component (UPDATED with Analytics tab)

import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import SubmitComplaint from "./components/SubmitComplaint";
import Analytics from "./components/Analytics";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleComplaintSubmitted = () => {
    setActivePage("dashboard");
    setRefreshTrigger((prev) => prev + 1);
  };

  const NAV = [
    { id: "dashboard", icon: "📋", label: "Dashboard" },
    { id: "analytics", icon: "📊", label: "Analytics" },
    { id: "submit",    icon: "✍️", label: "Submit Complaint" },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-icon">⚖️</span>
          <div>
            <h1 className="brand-title">CivicAI</h1>
            <p className="brand-subtitle">Smart Complaint Analyzer</p>
          </div>
        </div>
        <nav className="app-nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`nav-btn ${activePage === n.id ? "active" : ""}`}
              onClick={() => setActivePage(n.id)}
            >
              {n.icon} {n.label}
            </button>
          ))}
        </nav>
      </header>

      <div style={{
        background: "white", borderBottom: "1px solid #e2e8f0",
        padding: "12px 32px", display: "flex", alignItems: "center", gap: 8
      }}>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>CivicAI</span>
        <span style={{ color: "#cbd5e1" }}>&rsaquo;</span>
        <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>
          {NAV.find(n => n.id === activePage)?.label}
        </span>
      </div>

      <main className="app-main">
        {activePage === "dashboard" && <Dashboard refreshTrigger={refreshTrigger} />}
        {activePage === "analytics" && <Analytics />}
        {activePage === "submit"    && <SubmitComplaint onSubmitted={handleComplaintSubmitted} />}
      </main>

      <footer className="app-footer">
        <p>CivicAI &copy; 2026 &mdash; AI-Powered Civic Complaint Management | FastAPI + React + PostgreSQL</p>
      </footer>
    </div>
  );
}

export default App;