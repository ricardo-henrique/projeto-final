// src/app/models/post.model.ts

import { User } from './user.model'; // Importa User do seu arquivo user.model.ts

// Baseado em categotyEntity.png
export interface Category {
  id: string;
  name: string;
}

// Baseado em postModels.png e postEntity.jpg
export interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null; // Pode ser null
  slug: string;
  status: string; // 'draft' ou 'published'
  createdAt: string; // Vem como string da API
  updatedAt: string; // Vem como string da API
  author: User; // O autor é do tipo User
  authorId: string;
  category: Category | null; // A categoria pode ser null (onDelete: SET NULL)
  categoryId: string | null; // ID da categoria pode ser null
}

// Payload para criar/editar um Post (baseado em postModels.png)
export interface PostPayload {
  title: string;
  content: string;
  categoryId: string | null; // Pode ser null
}
