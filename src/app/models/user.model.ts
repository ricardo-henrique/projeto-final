// src/app/models/user.model.ts

// Baseado em userEntity.png
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // Opcional, pois não é retornado em todas as operações
  role: string; // 'user' ou 'admin'
  createdAt: string; // Vem como string da API
  updatedAt: string; // Vem como string da API
}

// Interfaces para autenticação (baseado em userModels.png)
export interface AuthResponse {
  token: string;
  user?: User; // Opcional: Se a API retornar o objeto User completo além do token.
  // Pelo que vimos, o token já contém o essencial para o frontend.
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
