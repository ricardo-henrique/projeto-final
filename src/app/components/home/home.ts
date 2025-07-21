import { Component, OnDestroy, OnInit } from '@angular/core';
import { Category, Post } from '../../models/post.model';
import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

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
    private router: Router
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
    this.selectedCategoryId = categoryId; // Atualiza a categoria selecionada

    // Modifique PostService.getPosts() para aceitar um parâmetro de categoria
    // Por enquanto, vamos simular a filtragem no frontend se sua API ainda não suportar
    this.postService.getPosts().subscribe({
      next: (data) => {
        if (categoryId) {
          // Simula a filtragem no frontend se a API não filtrar por categoria
          this.posts = data.filter((post) => post.category?.id === categoryId);
        } else {
          this.posts = data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar posts:', error);
        this.isLoading = false;
      },
    });
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

  formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  }
}
