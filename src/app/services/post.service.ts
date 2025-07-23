import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { Category, Post, PostPayload } from '../models/post.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/posts`).pipe(
      catchError((error) => {
        console.error('Erro ao carregar posts:', error);
        return throwError(() => error);
      })
    );
  }

  getPostBySlug(slug: string): Observable<Post | null> {
    return this.http.get<Post>(`${this.apiUrl}/posts/${slug}`).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          console.warn(`Post com slug '${slug}' não encontrado (404).`);
          return of(null);
        }
        console.error('Erro ao buscar post por slug:', error);
        return throwError(() => new Error('Erro ao carregar post.'));
      })
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  createPost(postData: PostPayload, imageFile: File): Observable<Post> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Usuário não autenticado. Não é possível criar o post.');
    }

    const formData = new FormData();
    formData.append('title', postData.title);
    formData.append('content', postData.content);

    if (postData.categoryId) {
      formData.append('categoryId', postData.categoryId);
    }
    formData.append('image', imageFile);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post<Post>(`${this.apiUrl}/posts`, formData, { headers });
  }

  updatePost(
    postId: string,
    postData: PostPayload,
    imageFile?: File
  ): Observable<Post> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error(
        'Usuário não autenticado. Não é possível atualizar o post.'
      );
    }

    const formData = new FormData();
    formData.append('title', postData.title);
    formData.append('content', postData.content);
    // Adiciona categoryId ou uma string vazia se for null (sua API deve lidar com isso)
    formData.append('categoryId', postData.categoryId || '');

    if (imageFile) {
      formData.append('image', imageFile); // Adiciona a nova imagem apenas se fornecida
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // Certifique-se de que sua API tem um endpoint PUT/PATCH /posts/:id que aceita FormData
    return this.http.put<Post>(`${this.apiUrl}/posts/${postId}`, formData, {
      headers,
    });
  }

  deletePost(postId: string): Observable<void> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error(
        'Usuário não autenticado. Não é possível deletar o post.'
      );
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    // Certifique-se de que sua API tem um endpoint DELETE /posts/:id
    return this.http.delete<void>(`${this.apiUrl}/posts/${postId}`, {
      headers,
    });
  }

  createCategory(categoryName: string): Observable<Category> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(
        () =>
          new Error('Usuário não autenticado. Não é possível criar categoria.')
      );
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json', // Para enviar JSON
    });

    // Certifique-se de que sua API tem um endpoint POST /categories
    return this.http
      .post<Category>(
        `${this.apiUrl}/categories`,
        { name: categoryName },
        { headers }
      )
      .pipe(
        catchError((error) => {
          console.error('Erro na API ao criar categoria:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Atualiza uma categoria existente na API.
   * @param categoryId O ID da categoria a ser atualizada.
   * @param newName O novo nome da categoria.
   * @returns Um Observable da Categoria atualizada.
   */
  updateCategory(categoryId: string, newName: string): Observable<Category> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(
        () =>
          new Error(
            'Usuário não autenticado. Não é possível atualizar categoria.'
          )
      );
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    // Certifique-se de que sua API tem um endpoint PUT/PATCH /categories/:id
    return this.http
      .put<Category>(
        `${this.apiUrl}/categories/${categoryId}`,
        { name: newName },
        { headers }
      )
      .pipe(
        catchError((error) => {
          console.error('Erro na API ao atualizar categoria:', error);
          return throwError(() => error);
        })
      );
  }

  deleteCategory(categoryId: string): Observable<void> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(
        () =>
          new Error(
            'Usuário não autenticado. Não é possível deletar categoria.'
          )
      );
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .delete<void>(`${this.apiUrl}/categories/${categoryId}`, { headers })
      .pipe(
        catchError((error) => {
          console.error('Erro na API ao deletar categoria:', error);
          return throwError(() => error);
        })
      );
  }
}
