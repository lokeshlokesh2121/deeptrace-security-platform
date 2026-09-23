import api from "../api/axios";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserPayload {
  name: string;
  role: string;
}

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get("/users");
  return response.data;
};

export const createUser = async (
  data: CreateUserPayload
): Promise<User> => {
  const res = await api.post("/users", data);
  return res.data;
};

export const updateUser = async (
  id: number,
  data: UpdateUserPayload
): Promise<User> => {
  const res = await api.put(`/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (
  id: number
): Promise<{ message: string }> => {
  const res = await api.delete(`/users/${id}`);
  return res.data;
};