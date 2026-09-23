import api from "../api/axios";

export const getAuditLogs = async () => {
  const res = await api.get(
    "/audit-logs"
  );

  return res.data;
};