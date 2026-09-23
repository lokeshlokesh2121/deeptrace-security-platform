import api from "../api/axios";

export interface Campaign {
  id: number;
  name: string;
  description?: string | null;
  status: CampaignStatus;
  tenantId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CampaignStatus =
  | "DRAFT"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export interface CampaignUser {
  campaignId: number;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface CampaignDetail extends Campaign {
  users: CampaignUser[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const getCampaigns = async (
  page = 1,
  limit = 10,
  search = "",
  status = ""
): Promise<Paginated<Campaign>> => {
  const res = await api.get(
    `/campaigns?page=${page}&limit=${limit}&search=${encodeURIComponent(
      search
    )}&status=${encodeURIComponent(status)}`
  );
  return res.data;
};

export const getCampaignById = async (
  id: number
): Promise<CampaignDetail> => {
  const res = await api.get(`/campaigns/${id}`);
  return res.data;
};

export const createCampaign = async (data: {
  name: string;
  description?: string;
}): Promise<Campaign> => {
  const res = await api.post("/campaigns", data);
  return res.data;
};

export const updateCampaign = async (
  id: number,
  data: Partial<Campaign>
): Promise<Campaign> => {
  const res = await api.put(`/campaigns/${id}`, data);
  return res.data;
};

export const deleteCampaign = async (
  id: number
): Promise<{ success: boolean }> => {
  const res = await api.delete(`/campaigns/${id}`);
  return res.data;
};

export const assignUserToCampaign = async (
  campaignId: number,
  userId: number
): Promise<CampaignUser> => {
  const res = await api.post(`/campaigns/${campaignId}/users`, { userId });
  return res.data;
};

export const removeUserFromCampaign = async (
  campaignId: number,
  userId: number
): Promise<{ success: boolean; message: string }> => {
  const res = await api.delete(
    `/campaigns/${campaignId}/users/${userId}`
  );
  return res.data;
};