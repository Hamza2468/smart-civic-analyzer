// components/SubmitComplaint.jsx
// ================================
// Form for citizens to submit new complaints.
// After submission, shows the AI classification result.

import React, { useState } from "react";
import { submitComplaint } from "../api/complaintsApi";

const INITIAL_FORM = {
  title: "",
  description: "",
  location: "",
  submitted_by: "",
};

export default function SubmitComplaint({ onSubmitted }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await submitComplaint({
        ...form,
        submitted_by: form.submitted_by || "Anonymous",
      });
      setResult(data);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err.message || "Failed to submit complaint.");
    } finally {
      setLoading(false);
    }
  };

  const PRIORITY_COLORS = {
    Critical: "#dc2626",
    High: "#d97706",
    Medium: "#2563eb",
    Low: "#16a34a",
  };

  return (
    <div className="submit-page">
      <div className="submit-container">

        {/* ── Left: Form ──────────────────────────────────────────── */}
        <div className="form-card">
          <div className="form-header">
            <h2>🗣️ Submit a Complaint</h2>
            <p>Describe your issue clearly. Our AI will automatically categorize and prioritize it.</p>
          </div>

          <form onSubmit={handleSubmit} className="complaint-form">

            <div className="form-group">
              <label className="form-label">Complaint Title *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Broken streetlight near school"
                className="form-input"
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the issue in detail. Include how long it's been happening and its impact..."
                className="form-textarea"
                rows={5}
              />
              <span className="char-count">{form.description.length} characters</span>
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Block 5, Sector 4, Main Road"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Your Name (optional)</label>
              <input
                type="text"
                name="submitted_by"
                value={form.submitted_by}
                onChange={handleChange}
                placeholder="e.g. Ahmed Khan (or leave blank for Anonymous)"
                className="form-input"
              />
            </div>

            {error && <div className="error-msg">⚠️ {error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-sm" /> Analyzing with AI...
                </>
              ) : (
                "🚀 Submit Complaint"
              )}
            </button>
          </form>
        </div>

        {/* ── Right: Result or Tips ────────────────────────────────── */}
        <div className="result-panel">
          {result ? (
            <div className="ai-result-card">
              <div className="ai-result-header">
                <span className="ai-icon">🧠</span>
                <h3>AI Analysis Complete!</h3>
              </div>

              <div className="ai-result-body">
                <div className="result-row">
                  <span className="result-label">Complaint ID</span>
                  <span className="result-value" style={{ fontWeight: "bold" }}>#{result.id}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Category Detected</span>
                  <span className="result-value category-tag">{result.category}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Priority Level</span>
                  <span className="result-value" style={{ color: PRIORITY_COLORS[result.priority], fontWeight: "bold" }}>
                    {result.priority === "Critical" && "🚨 "}
                    {result.priority === "High" && "⚠️ "}
                    {result.priority === "Medium" && "🔵 "}
                    {result.priority === "Low" && "🟢 "}
                    {result.priority}
                  </span>
                </div>
                <div className="result-row">
                  <span className="result-label">AI Confidence</span>
                  <span className="result-value">{Math.round(result.confidence * 100)}%</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Status</span>
                  <span className="result-value" style={{ color: "#d97706" }}>📋 {result.status}</span>
                </div>
              </div>

              <div className="result-footer">
                <p>✅ Your complaint has been registered and will be reviewed by the relevant authority.</p>
                <button className="btn-secondary" onClick={onSubmitted}>
                  View in Dashboard →
                </button>
              </div>
            </div>
          ) : (
            <div className="tips-card">
              <h3>💡 Tips for a Good Complaint</h3>
              <ul className="tips-list">
                <li>🎯 Be specific about the location</li>
                <li>📅 Mention how long the issue has existed</li>
                <li>📊 Describe the impact on people</li>
                <li>📸 Add details like "near the school" or "Block 5"</li>
                <li>✍️ Write in clear, simple sentences</li>
              </ul>

              <div className="ai-explanation">
                <h4>🤖 How the AI Works</h4>
                <p>Our AI reads your complaint and automatically:</p>
                <ul>
                  <li>📂 Assigns a <strong>category</strong> (Roads, Water, Electricity, etc.)</li>
                  <li>🔴 Sets a <strong>priority level</strong> (Critical/High/Medium/Low)</li>
                  <li>📊 Calculates a <strong>confidence score</strong></li>
                </ul>
                <p>This helps authorities respond faster to urgent issues!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}