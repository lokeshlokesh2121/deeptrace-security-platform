import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getEvents,
  deleteEvent,
  updateEvent,
} from "../services/eventService";

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";

import { useAuth } from "../context/AuthContext"; // adjust path

import "./EventPage.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type Status = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

interface SecurityEvent {
  id: number;
  eventType: string;
  severity: Severity;
  status: Status;
  description?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Status transition rules (mirror backend validation)
// ---------------------------------------------------------------------------

const ALLOWED_STATUS_TRANSITIONS: Record<Status, Status[]> = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

const SEVERITY_OPTIONS: Severity[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

const STATUS_OPTIONS: Status[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EventsPage = () => {
  // ---- Auth / role ----
  const { user: authUser } = useAuth();
  const role = authUser?.role?.toUpperCase() ?? "";
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const canCreate = isAdmin || isManager;
  const canUpdate = isAdmin || isManager;
  const canDelete = isAdmin;

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // ---- Edit modal state ----
  const [editing, setEditing] = useState<SecurityEvent | null>(null);
  const [editStatus, setEditStatus] = useState<Status>("OPEN");
  const [editSeverity, setEditSeverity] = useState<Severity>("LOW");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // ---- Delete dialog state ----
  const [deleting, setDeleting] = useState<SecurityEvent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------

  const loadEvents = async (nextPage = page) => {
    try {
      setLoading(true);
      const res = await getEvents(nextPage, limit, severity, status);

      if (Array.isArray(res)) {
        setEvents(res);
        setTotal(res.length);
      } else {
        setEvents(res.data);
        setTotal(res.total);
      }

      setPage(nextPage);
    } catch (err) {
      console.error(err);
      alert("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severity, status]);

  // -------------------------------------------------------------------------
  // Delete flow
  // -------------------------------------------------------------------------

  const openDelete = (event: SecurityEvent) => {
    if (!canDelete) return;
    setDeleting(event);
    setDeleteError("");
  };

  const closeDelete = () => {
    if (deleteLoading) return;
    setDeleting(null);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    if (!canDelete) return;

    try {
      setDeleteLoading(true);
      setDeleteError("");

      await deleteEvent(deleting.id);

      setDeleting(null);
      loadEvents(page);
    } catch (err: any) {
      console.error(err);
      setDeleteError(
        err?.response?.data?.message || "Failed to delete event"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Edit flow
  // -------------------------------------------------------------------------

  const openEdit = (event: SecurityEvent) => {
    if (!canUpdate) return;
    setEditing(event);
    setEditStatus(event.status);
    setEditSeverity(event.severity);
    setEditDescription(event.description || "");
    setEditError("");
  };

  const closeEdit = () => {
    if (saving) return;
    setEditing(null);
    setEditError("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editing) return;
    if (!canUpdate) return;

    if (
      editStatus !== editing.status &&
      !ALLOWED_STATUS_TRANSITIONS[editing.status].includes(editStatus)
    ) {
      setEditError(
        `Cannot transition from ${editing.status} to ${editStatus}`
      );
      return;
    }

    try {
      setSaving(true);
      setEditError("");

      await updateEvent(editing.id, {
        status: editStatus,
        severity: editSeverity,
        description: editDescription.trim() || null,
      });

      setEditing(null);
      loadEvents(page);
    } catch (err: any) {
      console.error(err);
      setEditError(
        err?.response?.data?.message || "Failed to update event"
      );
    } finally {
      setSaving(false);
    }
  };

  const editableStatuses: Status[] = editing
    ? [editing.status, ...ALLOWED_STATUS_TRANSITIONS[editing.status]]
    : [];

  const hasAnyRowAction = canUpdate || canDelete;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Layout>
      <div className="events-page">
        <div className="events-header">
          <div>
            <h1>Security Events</h1>
            <p className="events-subtitle">
              Monitor, triage and resolve security incidents
            </p>
          </div>

          {canCreate && (
            <Link to="/events/create" className="create-btn">
              + Create Event
            </Link>
          )}
        </div>

        <div className="filters">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="">All Severity</option>
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "IN_PROGRESS" ? "IN PROGRESS" : s}
              </option>
            ))}
          </select>
        </div>

        <div className="events-table">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Created</th>
                {hasAnyRowAction && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={hasAnyRowAction ? 5 : 4} className="empty-row">
                    Loading events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={hasAnyRowAction ? 5 : 4} className="empty-row">
                    No events found
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id}>
                    <td className="cell-strong">{event.eventType}</td>

                    <td>
                      <span
                        className={`badge ${event.severity.toLowerCase()}`}
                      >
                        {event.severity}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-pill status-${event.status.toLowerCase()}`}
                      >
                        {event.status === "IN_PROGRESS"
                          ? "IN PROGRESS"
                          : event.status}
                      </span>
                    </td>

                    <td className="cell-muted">
                      {new Date(event.createdAt).toLocaleString()}
                    </td>

                    {hasAnyRowAction && (
                      <td>
                        <div className="row-actions">
                          {canUpdate && (
                            <button
                              className="edit-btn"
                              onClick={() => openEdit(event)}
                            >
                              Edit
                            </button>
                          )}

                          {canDelete && (
                            <button
                              className="delete-btn"
                              onClick={() => openDelete(event)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={(p) => loadEvents(p)}
        />
      </div>

      {/* ---------- EDIT MODAL ---------- */}
      {canUpdate && editing && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Edit Event</h2>
                <p className="modal-subtitle">
                  #{editing.id} — {editing.eventType}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeEdit}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {editError && <div className="modal-error">{editError}</div>}

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label htmlFor="edit-severity">Severity</label>
                <select
                  id="edit-severity"
                  value={editSeverity}
                  onChange={(e) =>
                    setEditSeverity(e.target.value as Severity)
                  }
                >
                  {SEVERITY_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as Status)
                  }
                >
                  {editableStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s === "IN_PROGRESS" ? "IN PROGRESS" : s}
                    </option>
                  ))}
                </select>

                {ALLOWED_STATUS_TRANSITIONS[editing.status].length === 0 && (
                  <small className="field-hint">
                    This event is closed and cannot transition further.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  maxLength={1000}
                  placeholder="Add notes or update the description..."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeEdit}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- DELETE CONFIRMATION DIALOG ---------- */}
      {canDelete && deleting && (
        <div className="modal-backdrop" onClick={closeDelete}>
          <div
            className="modal-card modal-card-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Delete Event</h2>
                <p className="modal-subtitle">
                  #{deleting.id} — {deleting.eventType}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeDelete}
                disabled={deleteLoading}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {deleteError && <div className="modal-error">{deleteError}</div>}

            <p className="delete-warning">
              This action cannot be undone. The event and its associated
              data will be permanently removed.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={closeDelete}
                disabled={deleteLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-btn"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EventsPage;