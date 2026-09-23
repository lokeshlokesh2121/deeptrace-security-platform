interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  tenantId: number;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}