export type UserRole = "COMMON" | "MAKER" | "CHECKER";

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}