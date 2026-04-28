// components/Analytics.jsx
// ==========================
// Beautiful charts dashboard using recharts.
// Shows: category distribution, priority breakdown, status over time, top locations.
// Install recharts: npm install recharts

import React, { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar
} from "recharts";
import { getAnalyticsSummary, getComplaints } from "../api/complaintsApi";

// ── Color Palettes ─────────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  "Roads & Infrastructure": "#6366f1",
  "Water Supply":           "#0ea5e9",
  "Electricity":            "#f59e0b",
  "Waste Management":       "#10b981",
  "Public Safety":          "#ef4444",
  "Parks & Recreation":     "#84cc16",
  "Noise Pollution":        "#8b5cf6",
  "Health & Sanitation":    "#f97316",
  "Transport":              "#06b6d4",
  "Other":                  "#94a3b8",
};

const PRIORITY_COLORS = {
  Critical: "#dc2626",
  High:     "#d97706",
  Medium:   "#2563eb",
  Low:      "#16a34a",
};

const STATUS_COLORS = {
  "Open":        "#dc2626",
  "In Progress": "#d97706",
  "Resolved":    "#16a34a",
};

// ── Helper: Custom Tooltip ─────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0f172a", border: "1px solid #334155",
      borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "white"
    }}>
      {label && <p style={{ color: "#94a3b8", marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill, margin: "2px 0" }}>
          <strong>{p.name || p.dataKey}:</strong> {p.value}
        </p>
      ))}
    </div>
  );
};

// ── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color, trend }) {
  return (
    <div style={{
      background: "white", borderRadius: 8, padding: "20px 24px",
      borderTop: `4px solid ${color}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
          <p style={{ fontSize: 36, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: "#0f172a" }}>{value}</p>
          {sub && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{sub}</p>}
        </div>
        <div style={{ fontSize: 32, opacity: 0.8 }}>{icon}</div>
      </div>
      {trend && (
        <div style={{ marginTop: 12, fontSize: 12, color: trend > 0 ? "#dc2626" : "#16a34a" }}>
          {trend > 0 ? "▲" : "▼"} {Math.abs(trend)} vs last week
        </div>
      )}
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>{subtitle}</p>}
    </div>
  );
}

// ── Chart Card Wrapper ─────────────────────────────────────────────────────

function ChartCard({ children, style }) {
  return (
    <div style={{
      background: "white", borderRadius: 8, padding: 24,
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      border: "1px solid #e2e8f0",
      ...style
    }}>
      {children}
    </div>
  );
}

// ── Custom Pie Label ────────────────────────────────────────────────────────

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


// ══════════════════════════════════════════════════════════════════
// MAIN ANALYTICS COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAnalyticsSummary(), getComplaints()])
      .then(([s, c]) => {
        setSummary(s);
        setComplaints(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300, color: "#64748b" }}>
        <div className="spinner" style={{ marginRight: 12 }} /> Loading analytics...
      </div>
    );
  }

  if (!summary) return null;

  // ── Prepare chart data ───────────────────────────────────────

  const categoryData = Object.entries(summary.by_category || {})
    .map(([name, value]) => ({ name, value, fill: CATEGORY_COLORS[name] || "#94a3b8" }))
    .sort((a, b) => b.value - a.value);

  const priorityData = Object.entries(summary.by_priority || {})
    .map(([name, value]) => ({ name, value, fill: PRIORITY_COLORS[name] }))
    .sort((a, b) => {
      const order = ["Critical", "High", "Medium", "Low"];
      return order.indexOf(a.name) - order.indexOf(b.name);
    });

  const statusData = Object.entries(summary.by_status || {})
    .map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] }));

  // Avg confidence by category
  const confidenceMap = {};
  const countMap = {};
  complaints.forEach(c => {
    if (!confidenceMap[c.category]) { confidenceMap[c.category] = 0; countMap[c.category] = 0; }
    confidenceMap[c.category] += (c.confidence || 0);
    countMap[c.category]++;
  });
  const confidenceData = Object.entries(confidenceMap)
    .map(([cat, total]) => ({
      name: cat.replace(" & ", " &\n").replace("Infrastructure", "Infra"),
      confidence: Math.round((total / countMap[cat]) * 100)
    }))
    .sort((a, b) => b.confidence - a.confidence);

  // Resolution rate
  const total = summary.total || 1;
  const resolvedPct = Math.round(((summary.by_status?.Resolved || 0) / total) * 100);
  const openPct = Math.round(((summary.by_status?.Open || 0) / total) * 100);

  const radialData = [
    { name: "Resolved", value: resolvedPct, fill: "#16a34a" },
    { name: "In Progress", value: Math.round(((summary.by_status?.["In Progress"] || 0) / total) * 100), fill: "#d97706" },
    { name: "Open", value: openPct, fill: "#dc2626" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Top KPI Cards ─────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <StatCard icon="📋" label="Total Complaints" value={summary.total} color="#6366f1"
          sub="All time" />
        <StatCard icon="🔴" label="Awaiting Action" value={(summary.by_status?.Open || 0)}
          color="#dc2626" sub={`${openPct}% of total`} />
        <StatCard icon="✅" label="Resolved" value={summary.by_status?.Resolved || 0}
          color="#16a34a" sub={`${resolvedPct}% resolution rate`} />
        <StatCard icon="🚨" label="Critical Issues" value={summary.by_priority?.Critical || 0}
          color="#dc2626" sub="Needs immediate action" />
        <StatCard icon="⚠️" label="High Priority" value={summary.by_priority?.High || 0}
          color="#d97706" sub="Urgent attention" />
        <StatCard icon="🏷️" label="Categories" value={Object.keys(summary.by_category || {}).length}
          color="#0ea5e9" sub="Unique types" />
      </div>

      {/* ── Row 1: Pie Charts ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Category Distribution */}
        <ChartCard>
          <SectionHeader title="📂 Complaints by Category" subtitle="Distribution across all departments" />
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%" cy="50%"
                outerRadius={110}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={10}
                formatter={(value) => <span style={{ fontSize: 12, color: "#475569" }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Priority Distribution */}
        <ChartCard>
          <SectionHeader title="🚦 Priority Levels" subtitle="How urgent are current complaints" />
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%" cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={4}
                dataKey="value"
                label={renderCustomLabel}
                labelLine={false}
              >
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={10}
                formatter={(value) => <span style={{ fontSize: 12, color: "#475569" }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Priority counts summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
            {priorityData.map(p => (
              <div key={p.name} style={{
                background: "#f8fafc", borderRadius: 6, padding: "8px 12px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                borderLeft: `3px solid ${p.fill}`
              }}>
                <span style={{ fontSize: 13, color: "#475569" }}>{p.name}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: p.fill }}>{p.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* ── Row 2: Bar Chart + Radial ──────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>

        {/* Category Bar Chart */}
        <ChartCard>
          <SectionHeader title="📊 Volume by Category" subtitle="Number of complaints per department" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis
                type="category" dataKey="name" tick={{ fontSize: 11, fill: "#475569" }}
                width={160}
                tickFormatter={v => v.length > 20 ? v.slice(0, 18) + "…" : v}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="value" name="Complaints" radius={[0, 4, 4, 0]}>
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Resolution Radial */}
        <ChartCard>
          <SectionHeader title="🎯 Resolution Rate" subtitle="Current workflow status" />
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="30%" outerRadius="90%"
              data={radialData}
              startAngle={90} endAngle={-270}
            >
              <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "#f1f5f9" }}>
                {radialData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </RadialBar>
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {radialData.map(d => (
              <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.fill }} />
                  <span style={{ color: "#475569" }}>{d.name}</span>
                </div>
                <span style={{ fontWeight: 700, color: d.fill }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* ── Row 3: AI Confidence Bar ───────────────────────────── */}
      <ChartCard>
        <SectionHeader title="🧠 AI Classification Confidence by Category" subtitle="How confident the AI is when classifying each type of complaint" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={confidenceData} margin={{ left: 0, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip
              content={<CustomTooltip />}
              formatter={(v) => [`${v}%`, "Avg Confidence"]}
              cursor={{ fill: "#f8fafc" }}
            />
            <Bar dataKey="confidence" name="Avg Confidence" radius={[4, 4, 0, 0]}>
              {confidenceData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.confidence >= 80 ? "#16a34a" : entry.confidence >= 60 ? "#d97706" : "#dc2626"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center" }}>
          {[["#16a34a", "≥80% High confidence"], ["#d97706", "60–79% Medium"], ["#dc2626", "<60% Needs review"]].map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
              <div style={{ width: 10, height: 10, background: c, borderRadius: 2 }} />
              {l}
            </div>
          ))}
        </div>
      </ChartCard>

      {/* ── Row 4: Status Summary Cards ───────────────────────── */}
      <ChartCard>
        <SectionHeader title="📌 Status Overview" subtitle="Current complaint pipeline" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {statusData.map(s => (
            <div key={s.name} style={{
              background: "#f8fafc", borderRadius: 8, padding: 20,
              textAlign: "center", borderBottom: `4px solid ${s.fill}`
            }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: s.fill, fontFamily: "'IBM Plex Mono', monospace" }}>
                {s.value}
              </div>
              <div style={{ fontSize: 14, color: "#475569", marginTop: 6, fontWeight: 500 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                {Math.round((s.value / total) * 100)}% of total
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

    </div>
  );
}