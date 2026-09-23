import api from "../api/axios";

export interface Event {
  id: number;
  eventType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  description?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export const getEvents = async (
  page = 1,
  limit = 10,
  severity = "",
  status = ""
): Promise<Event[]> => {
  const res = await api.get(
    `/events?page=${page}&limit=${limit}&severity=${severity}&status=${status}`
  );
  return res.data;
};

export const getEventById = async (id: number): Promise<Event> => {
  const res = await api.get(`/events/${id}`);
  return res.data;
};

export const createEvent = async (data: any): Promise<Event> => {
  const res = await api.post("/events", data);
  return res.data;
};

export const updateEvent = async (
  id: number,
  data: Partial<Event>
): Promise<Event> => {
  const res = await api.put(`/events/${id}`, data);
  return res.data;
};

export const deleteEvent = async (
  id: number
): Promise<{ success: boolean }> => {
  const res = await api.delete(`/events/${id}`);
  return res.data;
};