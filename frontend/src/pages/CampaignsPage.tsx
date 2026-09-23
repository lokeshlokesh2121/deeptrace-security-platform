import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";

import {
  getCampaigns,
  getCampaignById,
  deleteCampaign,
  updateCampaign,
  assignUserToCampaign,
  removeUserFromCampaign,
  type Campaign,
  type CampaignStatus,
} from "../services/campaignService";

import { getUsers } from "../services/userService";

import { useAuth } from "../context/AuthContext"; // adjust path

import "./CampaignsPage.css";

const STATUS_OPTIONS: CampaignStatus[] = [
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];

const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

interface TenantUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function CampaignsPage() {
  // ---- Auth / role ----
  const { user: authUser } = useAuth();
  const role = authUser?.role?.toUpperCase() ?? "";
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const canCreate = isAdmin || isManager;
  const canEdit = isAdmin || isManager;
  const canAssign = isAdmin || isManager;
  const canDelete = isAdmin;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // ---- Edit modal state ----
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<CampaignStatus>("DRAFT");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // ---- Delete dialog state ----
  const [deleting, setDeleting] = useState<Campaign | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ---- Assign Users modal state ----
  const [assigning, setAssigning] = useState<Campaign | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [assignSearch, setAssignSearch] = useState("");

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------
  const loadCampaigns = async (nextPage = page) => {
    try {
      setLoading(true);
      const res = await getCampaigns(nextPage, limit, search, status);

      if (Array.isArray(res)) {
        setCampaigns(res);
        setTotal(res.length);
      } else {
        setCampaigns(res.data);
        setTotal(res.total);
      }

      setPage(nextPage);
    } catch (err) {
      console.error(err);
      alert("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  // -------------------------------------------------------------------------
  // Assign Users flow
  // -------------------------------------------------------------------------
  const openAssign = async (campaign: Campaign) => {
    if (!canAssign) return;

    setAssigning(campaign);
    setAssignError("");
    setAssignSearch("");
    setAssignedIds(new Set());
    setTenantUsers([]);

    try {
      setAssignLoading(true);

      const [usersRes, campaignDetail] = await Promise.all([
        getUsers(),
        getCampaignById(campaign.id),
      ]);

      let users: TenantUser[] = [];
      if (Array.isArray(usersRes)) {
        users = usersRes;
      } else if (Array.isArray((usersRes as any)?.data)) {
        users = (usersRes as any).data;
      } else if (Array.isArray((usersRes as any)?.data?.data)) {
        users = (usersRes as any).data.data;
      }

      setTenantUsers(users);

      const currentIds = new Set<number>(
        (campaignDetail.users || []).map((cu) => cu.userId)
      );
      setAssignedIds(currentIds);
    } catch (err: any) {
      console.error("openAssign failed:", {
        status: err?.response?.status,
        data: err?.response?.data,
        url: err?.config?.url,
      });
      setAssignError(
        err?.response?.data?.message || "Failed to load users"
      );
    } finally {
      setAssignLoading(false);
    }
  };

  const closeAssign = () => {
    if (pendingUserId !== null) return;
    setAssigning(null);
    setAssignError("");
  };

  const handleToggleAssignment = async (user: TenantUser) => {
    if (!assigning || pendingUserId !== null) return;

    const isAssigned = assignedIds.has(user.id);

    try {
      setPendingUserId(user.id);
      setAssignError("");

      if (isAssigned) {
        await removeUserFromCampaign(assigning.id, user.id);

        setAssignedIds((prev) => {
          const next = new Set(prev);
          next.delete(user.id);
          return next;
        });
      } else {
        await assignUserToCampaign(assigning.id, user.id);

        setAssignedIds((prev) => {
          const next = new Set(prev);
          next.add(user.id);
          return next;
        });
      }
    } catch (err: any) {
      console.error("toggle assignment failed:", {
        status: err?.response?.status,
        data: err?.response?.data,
        url: err?.config?.url,
        method: err?.config?.method,
      });
      setAssignError(
        err?.response?.data?.message || "Failed to update assignment"
      );
    } finally {
      setPendingUserId(null);
    }
  };

  // -------------------------------------------------------------------------
  // Delete flow
  // -------------------------------------------------------------------------
  const openDelete = (campaign: Campaign) => {
    if (!canDelete) return;
    setDeleting(campaign);
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

      await deleteCampaign(deleting.id);

      setDeleting(null);
      loadCampaigns(page);
    } catch (err: any) {
      console.error(err);
      setDeleteError(
        err?.response?.data?.message || "Failed to delete campaign"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Edit flow
  // -------------------------------------------------------------------------
  const openEdit = (campaign: Campaign) => {
    if (!canEdit) return;
    setEditing(campaign);
    setEditName(campaign.name || "");
    setEditDescription(campaign.description || "");
    setEditStatus(campaign.status);
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
    if (!canEdit) return;

    if (!editName.trim()) {
      setEditError("Campaign name is required");
      return;
    }

    if (
      editStatus !== editing.status &&
      !ALLOWED_TRANSITIONS[editing.status].includes(editStatus)
    ) {
      setEditError(
        `Cannot transition from ${editing.status} to ${editStatus}`
      );
      return;
    }

    try {
      setSaving(true);
      setEditError("");

      await updateCampaign(editing.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        status: editStatus,
      });

      setEditing(null);
      loadCampaigns(page);
    } catch (err: any) {
      console.error(err);
      setEditError(
        err?.response?.data?.message || "Failed to update campaign"
      );
    } finally {
      setSaving(false);
    }
  };

  const editableStatuses: CampaignStatus[] = editing
    ? [editing.status, ...ALLOWED_TRANSITIONS[editing.status]]
    : [];

  const filteredAssignUsers = tenantUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(assignSearch.toLowerCase())
  );

  const hasAnyRowAction = canAssign || canEdit || canDelete;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <Layout>
      <div className="campaigns-page">
        <div className="page-header">
          <div>
            <h1>Campaign Management</h1>
            <p className="page-subtitle">
              Create, track and manage your security campaigns
            </p>
          </div>

          <div className="page-header-actions">
            <button
              className="refresh-btn"
              onClick={() => loadCampaigns(page)}
            >
              Refresh
            </button>

            {canCreate && (
              <Link to="/campaigns/create" className="create-btn">
                + Create Campaign
              </Link>
            )}
          </div>
        </div>

        <div className="filters">
          <input
            placeholder="Search campaign..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button onClick={() => loadCampaigns(1)}>Apply</button>
        </div>

        <div className="campaign-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                {hasAnyRowAction && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={hasAnyRowAction ? 5 : 4} className="empty-row">
                    Loading campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={hasAnyRowAction ? 5 : 4} className="empty-row">
                    No campaigns found
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>#{campaign.id}</td>

                    <td className="cell-strong">{campaign.name}</td>

                    <td className="cell-muted">
                      {campaign.description || "—"}
                    </td>

                    <td>
                      <span
                        className={`status-badge status-${campaign.status.toLowerCase()}`}
                      >
                        {campaign.status}
                      </span>
                    </td>

                    {hasAnyRowAction && (
                      <td>
                        <div className="row-actions">
                          {canAssign && (
                            <button
                              className="assign-btn"
                              onClick={() => openAssign(campaign)}
                            >
                              Assign Users
                            </button>
                          )}

                          {canEdit && (
                            <button
                              className="edit-btn"
                              onClick={() => openEdit(campaign)}
                            >
                              Edit
                            </button>
                          )}

                          {canDelete && (
                            <button
                              className="delete-btn"
                              onClick={() => openDelete(campaign)}
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
          onPageChange={(p) => loadCampaigns(p)}
        />
      </div>

      {/* ---------- ASSIGN USERS MODAL ---------- */}
      {canAssign && assigning && (
        <div className="modal-backdrop" onClick={closeAssign}>
          <div
            className="modal-card modal-card-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Manage Assigned Users</h2>
                <p className="modal-subtitle">
                  #{assigning.id} — {assigning.name}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeAssign}
                disabled={pendingUserId !== null}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {assignError && (
              <div className="modal-error">{assignError}</div>
            )}

            <div className="assign-search">
              <input
                placeholder="Search users..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
              />
            </div>

            {assignLoading ? (
              <div className="assign-loading">Loading users...</div>
            ) : filteredAssignUsers.length === 0 ? (
              <div className="assign-empty">No users found</div>
            ) : (
              <ul className="assign-list">
                {filteredAssignUsers.map((u) => {
                  const isAssigned = assignedIds.has(u.id);
                  const isPending = pendingUserId === u.id;

                  return (
                    <li key={u.id} className="assign-item">
                      <div className="assign-user">
                        <div className="assign-avatar">
                          {u.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="assign-user-info">
                          <span className="assign-name">{u.name}</span>
                          <span className="assign-email">{u.email}</span>
                        </div>

                        <span
                          className={`role-badge ${u.role.toLowerCase()}`}
                        >
                          {u.role}
                        </span>
                      </div>

                      <button
                        className={
                          isAssigned
                            ? "unassign-btn"
                            : "assign-toggle-btn"
                        }
                        disabled={pendingUserId !== null}
                        onClick={() => handleToggleAssignment(u)}
                      >
                        {isPending
                          ? "..."
                          : isAssigned
                          ? "Remove"
                          : "Assign"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={closeAssign}
                disabled={pendingUserId !== null}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- EDIT MODAL ---------- */}
      {canEdit && editing && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Edit Campaign</h2>
                <p className="modal-subtitle">
                  #{editing.id} — {editing.name}
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
                <label htmlFor="edit-name">Campaign Name</label>
                <input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  maxLength={1000}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as CampaignStatus)
                  }
                >
                  {editableStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                {ALLOWED_TRANSITIONS[editing.status].length === 0 && (
                  <small className="field-hint">
                    This campaign is in a final state and cannot transition
                    further.
                  </small>
                )}
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
                <h2>Delete Campaign</h2>
                <p className="modal-subtitle">
                  #{deleting.id} — {deleting.name}
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
              This action cannot be undone. The campaign and all of its user
              assignments will be permanently removed.
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
                {deleteLoading ? "Deleting..." : "Delete Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}