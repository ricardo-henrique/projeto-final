export interface User {
  id: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ResgisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
