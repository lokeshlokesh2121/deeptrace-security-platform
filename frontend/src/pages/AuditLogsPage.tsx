import { useEffect, useState } from "react";

import api from "../api/axios";
import Layout from "../components/Layout";
import Pagination from "../components/Pagination";

import "./AuditLogsPage.css";

interface AuditLog {
  id: number;
  action: string;
  entity: string;
  entityId: number;
  createdAt: string;
  user?: {
    id: number;
    name: string;
  } | null;
}

const AuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const loadLogs = async (nextPage = page) => {
    try {
      setLoading(true);

      const res = await api.get(
        `/audit-logs?page=${nextPage}&limit=${limit}`
      );

      // Support both response shapes:
      //   { data: AuditLog[], total: number }
      //   AuditLog[]
      if (Array.isArray(res.data)) {
        setLogs(res.data);
        setTotal(res.data.length);
      } else {
        setLogs(res.data.data);
        setTotal(res.data.total);
      }

      setPage(nextPage);
    } catch (error) {
      console.error(error);
      alert("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <div className="audit-page">
        <div className="audit-header">
          <div>
            <h1>Audit Logs</h1>
            <p>
              Security activity and system actions across the platform
            </p>
          </div>
        </div>

        {loading ? (
          <div className="audit-loading">
            <h2>Loading Audit Logs...</h2>
          </div>
        ) : (
          <>
            <div className="audit-table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Entity ID</th>
                    <th>User</th>
                    <th>Date &amp; Time</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td className="cell-muted">{log.id}</td>

                        <td>
                          <span className="action-badge">
                            {log.action}
                          </span>
                        </td>

                        <td className="cell-strong">{log.entity}</td>

                        <td className="cell-muted">{log.entityId}</td>

                        <td>{log.user?.name || "N/A"}</td>

                        <td className="cell-muted">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        No Audit Logs Found
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
              onPageChange={(p) => loadLogs(p)}
            />
          </>
        )}
      </div>
    </Layout>
  );
};

export default AuditLogsPage;