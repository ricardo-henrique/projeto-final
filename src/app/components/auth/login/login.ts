import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { LoginCredentials } from '../../../models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string | null = null;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;

      const loginData: LoginCredentials = this.loginForm.value;

      this.authService.login(loginData).subscribe({
        next: (Response) => {
          this.isLoading = false;
          if (Response) {
            this.router.navigate(['/']);
          } else {
            this.errorMessage = 'Credentials invalidos. Tente Novamente';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login error', error);
          this.errorMessage =
            error.error?.message || 'Erro ao fazer login. tente novamente.';
        },
      });
    } else {
      this.errorMessage = 'Por favor, preencha todos os campos.';
      this.loginForm.markAllAsTouched();
    }
  }
}
