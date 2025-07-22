import { User } from './user.model';

export interface Category {
  id: string;
  name: string;
}

export interface Author {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  slug: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  author: Author;
  authorId: string;
  category: Category | null;
  categoryId: string | null;
}

export interface PostPayload {
  title: string;
  content: string;
  categoryId: string | null;
}
