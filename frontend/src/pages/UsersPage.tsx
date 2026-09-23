import { useEffect, useState } from "react";

import Layout from "../components/Layout";
import Pagination from "../components/Pagination";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userService";

import { useAuth } from "../context/AuthContext"; // adjust path

import "./UsersPage.css";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const ROLE_OPTIONS = ["ADMIN", "MANAGER", "USER"] as const;
type Role = (typeof ROLE_OPTIONS)[number];

const UsersPage = () => {
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role?.toUpperCase() === "ADMIN";

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination (client-side)
  const [page, setPage] = useState(1);
  const limit = 10;

  // ---- Create User modal ----
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("USER");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // ---- Edit User modal ----
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<Role>("USER");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // ---- Delete User dialog ----
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // -------------------------------------------------------------------------
  // Load users
  // -------------------------------------------------------------------------
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Reset to page 1 whenever the search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // -------------------------------------------------------------------------
  // Create User flow
  // -------------------------------------------------------------------------
  const openCreate = () => {
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("USER");
    setCreateError("");
    setShowCreate(true);
  };

  const closeCreate = () => {
    if (creating) return;
    setShowCreate(false);
    setCreateError("");
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setCreateError("Name, email and password are required");
      return;
    }

    if (newPassword.length < 6) {
      setCreateError("Password must be at least 6 characters");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      await createUser({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      });

      setShowCreate(false);
      loadUsers();
    } catch (err: any) {
      console.error(err);
      setCreateError(
        err?.response?.data?.message || "Failed to create user"
      );
    } finally {
      setCreating(false);
    }
  };

  // -------------------------------------------------------------------------
  // Edit User flow
  // -------------------------------------------------------------------------
  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole((user.role as Role) || "USER");
    setEditError("");
  };

  const closeEdit = () => {
    if (saving) return;
    setEditingUser(null);
    setEditError("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editName.trim()) {
      setEditError("Name is required");
      return;
    }

    try {
      setSaving(true);
      setEditError("");

      await updateUser(editingUser.id, {
        name: editName.trim(),
        role: editRole,
      });

      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      console.error(err);
      setEditError(
        err?.response?.data?.message || "Failed to update user"
      );
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Delete User flow
  // -------------------------------------------------------------------------
  const openDelete = (user: User) => {
    setDeletingUser(user);
    setDeleteError("");
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeletingUser(null);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    try {
      setDeleting(true);
      setDeleteError("");

      await deleteUser(deletingUser.id);

      setDeletingUser(null);
      loadUsers();
    } catch (err: any) {
      console.error(err);
      setDeleteError(
        err?.response?.data?.message || "Failed to delete user"
      );
    } finally {
      setDeleting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Filter + paginate
  // -------------------------------------------------------------------------
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const total = filteredUsers.length;
  const startIndex = (page - 1) * limit;
  const pagedUsers = filteredUsers.slice(startIndex, startIndex + limit);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <Layout>
      <div className="users-page">
        <div className="users-header">
          <div>
            <h1>User Management</h1>
            <p>Manage tenant users and roles</p>
          </div>

          <div className="users-header-right">
            <div className="user-count">Total Users: {users.length}</div>

            {isAdmin && (
              <button
                className="create-btn"
                onClick={openCreate}
                type="button"
              >
                + Create User
              </button>
            )}
          </div>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="empty-row">
                    Loading users...
                  </td>
                </tr>
              ) : pagedUsers.length > 0 ? (
                pagedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="cell-strong">{user.name}</td>

                    <td className="cell-muted">{user.email}</td>

                    <td>
                      <span
                        className={`role-badge ${user.role.toLowerCase()}`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {isAdmin && (
                      <td>
                        <div className="row-actions">
                          <button
                            className="edit-btn"
                            onClick={() => openEdit(user)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() => openDelete(user)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="empty-row">
                    No Users Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
        />
      </div>

      {/* ---------- CREATE USER MODAL ---------- */}
      {showCreate && (
        <div className="modal-backdrop" onClick={closeCreate}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Create User</h2>
                <p className="modal-subtitle">
                  Add a new user to your tenant
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeCreate}
                disabled={creating}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {createError && (
              <div className="modal-error">{createError}</div>
            )}

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label htmlFor="new-name">Name</label>
                <input
                  id="new-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-email">Email</label>
                <input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-password">Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-role">Role</label>
                <select
                  id="new-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeCreate}
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- EDIT USER MODAL ---------- */}
      {editingUser && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Edit User</h2>
                <p className="modal-subtitle">
                  #{editingUser.id} — {editingUser.email}
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

            {editError && (
              <div className="modal-error">{editError}</div>
            )}

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label htmlFor="edit-name">Name</label>
                <input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  disabled
                  title="Email cannot be changed"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-role">Role</label>
                <select
                  id="edit-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
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

      {/* ---------- DELETE USER DIALOG ---------- */}
      {deletingUser && (
        <div className="modal-backdrop" onClick={closeDelete}>
          <div
            className="modal-card modal-card-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Delete User</h2>
                <p className="modal-subtitle">
                  #{deletingUser.id} — {deletingUser.email}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeDelete}
                disabled={deleting}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {deleteError && (
              <div className="modal-error">{deleteError}</div>
            )}

            <p className="delete-warning">
              This action cannot be undone. The user will be permanently
              removed from your tenant.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={closeDelete}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-btn"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UsersPage;