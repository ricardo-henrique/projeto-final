export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
