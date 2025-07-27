import { Component, OnDestroy, OnInit } from '@angular/core';
import { Category, Post } from '../../models/post.model';
import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  posts: Post[] = [];
  categories: Category[] = []; // Nova propriedade para armazenar categorias
  isLoading: boolean = true;
  isUserLoggedIn: boolean = false;
  userRole: string | null = null;
  userFirstName: string | null = null;
  selectedCategoryId: string | null = null; // Nova propriedade para a categoria selecionada

  private authSubscription: Subscription | undefined;

  constructor(
    public authService: AuthService,
    private postService: PostService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadPosts(); // Carrega todos os posts inicialmente
    this.loadCategories(); // Carrega as categorias para a sidebar

    this.authSubscription = this.authService.isLoggedIn$.subscribe(
      (isLoggedIn) => {
        this.isUserLoggedIn = isLoggedIn;
        if (isLoggedIn) {
          this.userRole = this.authService.getRole();
          this.userFirstName = this.authService.getFirstName();
        } else {
          this.userRole = null;
          this.userFirstName = null;
        }
      }
    );

    this.isUserLoggedIn = this.authService.isLoggedIn();
    if (this.isUserLoggedIn) {
      this.userRole = this.authService.getRole();
      this.userFirstName = this.authService.getFirstName();
    }
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  /**
   * Carrega os posts da API. Pode ser filtrado por categoria.
   * @param categoryId (Opcional) O ID da categoria para filtrar os posts.
   */
  loadPosts(categoryId: string | null = null): void {
    this.isLoading = true;
    this.selectedCategoryId = categoryId;

    this.postService.getPosts().subscribe({
      next: (data) => {
        // LOG DE DEPURACAO AQUI: O QUE 'data' CONTÉM?
        // console.log('Dados de posts recebidos no HomeComponent:', data);

        if (categoryId) {
          this.posts = data.filter((post) => post.category?.id === categoryId);
        } else {
          this.posts = data;
        }
        // console.log('Posts após filtragem no HomeComponent:', this.posts); // O que está sendo atribuído a this.posts?
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar posts:', error);
        this.isLoading = false;
      },
    });
  }

  getSanitizedHtml(htmlContent: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(htmlContent);
  }

  /**
   * Carrega as categorias para a sidebar.
   */
  loadCategories(): void {
    this.postService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Erro ao carregar categorias para a sidebar:', error);
        // Não é crítico para a funcionalidade principal, então apenas loga o erro
      },
    });
  }

  /**
   * Lida com o clique em uma categoria na sidebar.
   * @param categoryId O ID da categoria clicada.
   */
  onCategorySelected(categoryId: string | null): void {
    this.loadPosts(categoryId); // Recarrega os posts com o filtro de categoria
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatDate(date: Date): string {
    if (!date) {
      return 'Data Indisponível'; // Ou qualquer outra mensagem de fallback
    }
    // Tenta converter para Date se for string
    const d = typeof date === 'string' ? new Date(date) : date;

    // Verifica se o objeto Date é válido
    if (isNaN(d.getTime())) {
      return 'Data Inválida'; // Se a conversão resultou em uma data inválida
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return d.toLocaleDateString('pt-BR', options);
  }
}
