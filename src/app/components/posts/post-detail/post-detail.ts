import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { PostService } from '../../../services/post.service';
import { AuthService } from '../../../services/auth.service';
import { Post } from '../../../models/post.model';

@Component({
  selector: 'app-post-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.css',
})
export class PostDetail implements OnInit, OnDestroy {
  post: Post | null = null;
  isLoading: boolean = true;
  apiError: string | null = null;

  isUserLoggedIn: boolean = false;
  userRole: string | null = null;
  currentUserId: string | null = null;

  private authSubscription: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.loadPostDetail(slug);
      } else {
        this.apiError = 'Slug do post não fornecido.';
        this.isLoading = false;
        this.router.navigate(['/']);
      }
    });

    this.authSubscription = this.authService.isLoggedIn$.subscribe(
      (isLoggedIn) => {
        this.isUserLoggedIn = isLoggedIn;
        if (isLoggedIn) {
          this.userRole = this.authService.getRole();
          this.currentUserId = this.authService.getUserId();
        } else {
          this.userRole = null;
          this.currentUserId = null;
        }
      }
    );

    this.isUserLoggedIn = this.authService.isLoggedIn();
    if (this.isUserLoggedIn) {
      this.userRole = this.authService.getRole();
      this.currentUserId = this.authService.getUserId();
    }
  }

  ngOnDestroy(): void {
    // Cancela a inscrição para evitar vazamento de memória
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  loadPostDetail(slug: string): void {
    this.isLoading = true;
    this.apiError = null;
    this.post = null;

    this.postService
      .getPostBySlug(slug)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (postData) => {
          if (postData) {
            this.post = postData;
          } else {
            this.apiError = 'Post não encontrado ou não existe.';
            this.router.navigate(['/']);
          }
        },
        error: (error) => {
          console.error('Erro ao carregar detalhes do post:', error);
          this.apiError =
            error.error?.message ||
            'Erro ao carregar o post. Tente novamente mais tarde.';
          this.router.navigate(['/']);
        },
      });
  }

  canEditOrDeletePost(): boolean {
    if (!this.isUserLoggedIn || !this.post) {
      return false; // Não logado ou post não carregado
    }

    // Se for admin, pode editar/excluir qualquer post
    if (this.userRole === 'admin') {
      return true;
    }

    // Se for o autor do post
    return this.currentUserId === this.post.authorId;
  }

  editPost(): void {
    if (this.post && this.canEditOrDeletePost()) {
      this.router.navigate(['/posts/edit', this.post.slug]);
    }
  }

  deletePost(): void {
    if (this.post && this.canEditOrDeletePost()) {
      if (
        confirm(
          `Tem certeza que deseja deletar o post "${this.post.title}"? Esta ação não pode ser desfeita.`
        )
      ) {
        this.isLoading = true; // Ativa o spinner enquanto deleta
        this.apiError = null; // Limpa erros anteriores

        this.postService
          .deletePost(this.post.id)
          .pipe(
            finalize(() => (this.isLoading = false)) // Desativa o spinner
          )
          .subscribe({
            next: () => {
              alert('Post deletado com sucesso!'); // Use um modal customizado em produção
              this.router.navigate(['/']); // Redireciona para a home após a exclusão
            },
            error: (error) => {
              console.error('Erro ao deletar post:', error);
              this.apiError =
                error.error?.message ||
                'Erro ao deletar o post. Tente novamente.';
            },
          });
      }
    } else {
      alert('Você não tem permissão para deletar este post.'); // Use um modal customizado
    }
  }
}
