import { Component, OnDestroy, OnInit } from '@angular/core';
import { Post } from '../../models/post.model';
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
  isLoading: boolean = true;
  isUserLoggedIn: boolean = false;
  userRole: string | null = null;
  // userId: string | null = null;
  userFirstName: string | null = null;

  private authSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private postService: PostService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPosts();

    this.authSubscription = this.authService.isLoggedIn$.subscribe(
      (isLoggedIn) => {
        this.isUserLoggedIn = isLoggedIn;
        if (isLoggedIn) {
          this.userRole = this.authService.getRole();
          // this.userId = this.authService.getUserId();
          this.userFirstName = this.authService.getFirstName();
        } else {
          this.userRole = null;
          // this.userId = null;
          this.userFirstName = null;
        }
      }
    );

    this.isUserLoggedIn = this.authService.isLoggedIn();
    if (this.isUserLoggedIn) {
      this.userRole = this.authService.getRole();
      // this.userId = this.authService.getUserId();
      this.userFirstName = this.authService.getFirstName();
    }
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  loadPosts(): void {
    this.isLoading = true;
    this.postService.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao Carregar posts:', error);
        this.isLoading = false;
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  }
}
