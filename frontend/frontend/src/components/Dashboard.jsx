// components/Dashboard.jsx
// =========================
// Main dashboard showing complaint table, filters, and analytics cards.

import React, { useState, useEffect, useCallback } from "react";
import { getComplaints, getAnalyticsSummary, updateStatus, deleteComplaint } from "../api/complaintsApi";

// ── Priority badge colors ─────────────────────────────────────────────────────
const PRIORITY_STYLES = {
  Critical: { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
  High:     { bg: "#fef3c7", color: "#d97706", border: "#fcd34d" },
  Medium:   { bg: "#dbeafe", color: "#2563eb", border: "#93c5fd" },
  Low:      { bg: "#dcfce7", color: "#16a34a", border: "#86efac" },
};

const STATUS_STYLES = {
  "Open":        { bg: "#fee2e2", color: "#dc2626" },
  "In Progress": { bg: "#fef3c7", color: "#d97706" },
  "Resolved":    { bg: "#dcfce7", color: "#16a34a" },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="stat-icon" style={{ color }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.Low;
  return (
    <span className="badge" style={{
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`
    }}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES["Open"];
  return (
    <span className="badge" style={{ background: style.bg, color: style.color }}>
      {status}
    </span>
  );
}

function ConfidenceBar({ value }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 80 ? "#16a34a" : pct >= 60 ? "#d97706" : "#dc2626";
  return (
    <div className="confidence-wrap">
      <div className="confidence-bar" style={{ width: `${pct}%`, background: color }} />
      <span className="confidence-label">{pct}%</span>
    </div>
  );
}


// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ refreshTrigger }) {
  const [complaints, setComplaints] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: "", category: "", priority: "" });
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [complaintsData, summaryData] = await Promise.all([
        getComplaints(filters),
        getAnalyticsSummary(),
      ]);
      setComplaints(complaintsData);
      setSummary(summaryData);
    } catch (err) {
      setError("Failed to load data. Is the backend running on port 8000?");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, refreshTrigger]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateStatus(id, newStatus);
      loadData();
      if (selectedComplaint?.id === id) {
        setSelectedComplaint(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this complaint?")) return;
    try {
      await deleteComplaint(id);
      setSelectedComplaint(null);
      loadData();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const categories = [
    "Roads & Infrastructure", "Water Supply", "Electricity",
    "Waste Management", "Public Safety", "Parks & Recreation",
    "Noise Pollution", "Health & Sanitation", "Transport", "Other"
  ];

  return (
    <div className="dashboard">

      {/* ── Analytics Cards ──────────────────────────────────────── */}
      {summary && (
        <section className="stats-grid">
          <StatCard icon="📋" label="Total Complaints" value={summary.total} color="#6366f1" />
          <StatCard icon="🔴" label="Open" value={summary.by_status?.Open || 0} color="#dc2626" />
          <StatCard icon="🟡" label="In Progress" value={summary.by_status?.["In Progress"] || 0} color="#d97706" />
          <StatCard icon="✅" label="Resolved" value={summary.by_status?.Resolved || 0} color="#16a34a" />
          <StatCard icon="🚨" label="Critical" value={summary.by_priority?.Critical || 0} color="#dc2626" />
          <StatCard icon="⚠️" label="High Priority" value={summary.by_priority?.High || 0} color="#d97706" />
        </section>
      )}

      {/* ── Filters ──────────────────────────────────────────────── */}
      <section className="filters-bar">
        <h2 className="section-title">📋 All Complaints</h2>
        <div className="filters">
          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>

          <select
            value={filters.category}
            onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>

          <select
            value={filters.priority}
            onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
            className="filter-select"
          >
            <option value="">All Priorities</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>

          <button className="btn-secondary" onClick={() => setFilters({ status: "", category: "", priority: "" })}>
            Clear Filters
          </button>
        </div>
      </section>

      {/* ── Error State ───────────────────────────────────────────── */}
      {error && (
        <div className="error-banner">⚠️ {error}</div>
      )}

      {/* ── Loading State ─────────────────────────────────────────── */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading complaints...</p>
        </div>
      ) : (

        /* ── Two-panel layout ─────────────────────────────────────── */
        <div className="complaints-layout">

          {/* Left: Table */}
          <div className="complaints-table-wrap">
            {complaints.length === 0 ? (
              <div className="empty-state">
                <p>🗂️ No complaints found.</p>
                <p>Submit one using the button above!</p>
              </div>
            ) : (
              <table className="complaints-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>AI Confidence</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map(c => (
                    <tr
                      key={c.id}
                      className={`table-row ${selectedComplaint?.id === c.id ? "row-selected" : ""}`}
                      onClick={() => setSelectedComplaint(c)}
                    >
                      <td className="id-cell">#{c.id}</td>
                      <td className="title-cell">{c.title}</td>
                      <td><span className="category-tag">{c.category}</span></td>
                      <td><PriorityBadge priority={c.priority} /></td>
                      <td><StatusBadge status={c.status} /></td>
                      <td><ConfidenceBar value={c.confidence} /></td>
                      <td className="actions-cell" onClick={e => e.stopPropagation()}>
                        <select
                          value={c.status}
                          onChange={e => handleStatusChange(c.id, e.target.value)}
                          className="status-select"
                        >
                          <option>Open</option>
                          <option>In Progress</option>
                          <option>Resolved</option>
                        </select>
                        <button className="btn-danger-sm" onClick={() => handleDelete(c.id)}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Right: Detail Panel */}
          {selectedComplaint && (
            <div className="detail-panel">
              <div className="detail-header">
                <h3>Complaint Detail</h3>
                <button className="close-btn" onClick={() => setSelectedComplaint(null)}>✕</button>
              </div>

              <div className="detail-body">
                <p className="detail-title">{selectedComplaint.title}</p>
                <p className="detail-description">{selectedComplaint.description}</p>

                <div className="detail-meta">
                  <div className="meta-row">
                    <span className="meta-label">📍 Location</span>
                    <span>{selectedComplaint.location || "Not specified"}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">👤 Submitted By</span>
                    <span>{selectedComplaint.submitted_by}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">🏷️ Category</span>
                    <span>{selectedComplaint.category}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">🚦 Priority</span>
                    <PriorityBadge priority={selectedComplaint.priority} />
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">📌 Status</span>
                    <StatusBadge status={selectedComplaint.status} />
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">🧠 AI Confidence</span>
                    <span>{Math.round((selectedComplaint.confidence || 0) * 100)}%</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">📅 Submitted</span>
                    <span>{new Date(selectedComplaint.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="detail-actions">
                  <label className="detail-label">Update Status:</label>
                  <select
                    value={selectedComplaint.status}
                    onChange={e => handleStatusChange(selectedComplaint.id, e.target.value)}
                    className="status-select-lg"
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                  </select>

                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(selectedComplaint.id)}
                  >
                    🗑️ Delete Complaint
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}