// api/complaintsApi.js
// =====================
// All API calls to the FastAPI backend are defined here.
// This separates concerns: components don't know about fetch/axios details.

const BASE_URL = "https://smart-civic-analyzer-production.up.railway.app/";

// ── Helper ────────────────────────────────────────────────────────────────────
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

// ── Complaints ────────────────────────────────────────────────────────────────

/**
 * Submit a new complaint.
 * The backend AI will automatically classify it.
 */
export async function submitComplaint(data) {
  const response = await fetch(`${BASE_URL}/complaints/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

/**
 * Get all complaints with optional filters.
 * @param {Object} filters - { status, category, priority }
 */
export async function getComplaints(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status)   params.append("status", filters.status);
  if (filters.category) params.append("category", filters.category);
  if (filters.priority) params.append("priority", filters.priority);

  const url = `${BASE_URL}/complaints/?${params.toString()}`;
  const response = await fetch(url);
  return handleResponse(response);
}

/**
 * Update a complaint's status.
 * @param {number} id - Complaint ID
 * @param {string} status - "Open" | "In Progress" | "Resolved"
 */
export async function updateStatus(id, status) {
  const response = await fetch(`${BASE_URL}/complaints/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
}

/**
 * Delete a complaint.
 */
export async function deleteComplaint(id) {
  const response = await fetch(`${BASE_URL}/complaints/${id}`, {
    method: "DELETE",
  });
  return handleResponse(response);
}

/**
 * Get analytics summary for dashboard cards.
 */
export async function getAnalyticsSummary() {
  const response = await fetch(`${BASE_URL}/analytics/summary`);
  return handleResponse(response);
}