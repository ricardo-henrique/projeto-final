export interface Post {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrl: string; // URL da imagem destacada
  author: {
    id: string;
    username: string; // Ou firstName + lastName, dependendo da sua API
  };
  category: {
    id: string;
    name: string;
  };
  createdAt: string; // Data de criação
  updatedAt: string;
}
