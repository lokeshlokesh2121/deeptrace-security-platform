import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createEvent } from "../services/eventService";

import Layout from "../components/Layout";

import "./CreateEventPage.css";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type Status = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

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

const CreateEventPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    eventType: "",
    severity: "LOW" as Severity,
    status: "OPEN" as Status,
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.eventType.trim()) {
      setError("Event type is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createEvent({
        eventType: form.eventType.trim(),
        severity: form.severity,
        status: form.status,
        description: form.description.trim() || null,
      });

      navigate("/events");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Failed to create event"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="event-form">
        <div className="event-form-card">

          <div className="event-form-header">
            <h1>Create Security Event</h1>
            <p>
              Log a new security incident for your tenant
            </p>
          </div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label htmlFor="event-type">Event Type</label>
              <input
                id="event-type"
                placeholder="e.g. Unauthorized Access Attempt"
                value={form.eventType}
                onChange={(e) =>
                  setForm({ ...form, eventType: e.target.value })
                }
                maxLength={120}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="event-severity">Severity</label>
                <select
                  id="event-severity"
                  value={form.severity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      severity: e.target.value as Severity,
                    })
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
                <label htmlFor="event-status">Status</label>
                <select
                  id="event-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as Status,
                    })
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === "IN_PROGRESS" ? "IN PROGRESS" : s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="event-description">
                Description
              </label>
              <textarea
                id="event-description"
                rows={5}
                placeholder="Describe what happened, affected systems, and any initial findings..."
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                maxLength={1000}
              />
              <small className="form-hint">
                {form.description.length} / 1000 characters
              </small>
            </div>

            <div className="actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate("/events")}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-btn"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateEventPage;