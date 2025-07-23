import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from '../models/user.model';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  private _isLoggedIn = new BehaviorSubject<boolean>(this.isLoggedIn());
  isLoggedIn$ = this._isLoggedIn.asObservable();
  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginCredentials): Observable<AuthResponse | null> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response: AuthResponse) => {
          if (response.token) {
            localStorage.setItem('authToken', response.token);
            const decodeToken = this.decodeToken(response.token);
            if (decodeToken) {
              localStorage.setItem('userRole', decodeToken.role);
              localStorage.setItem('userId', decodeToken.id);
              if (decodeToken.firstName) {
                localStorage.setItem('userFirstName', decodeToken.firstName);
              }
            }
            this.setLoggedIn(true);
          }
        }),
        catchError((error) => {
          this.setLoggedIn(false);
          return of(null);
        })
      );
  }

  register(userData: RegisterCredentials): Observable<AuthResponse | null> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        tap((response: AuthResponse) => {
          if (response.token) {
            localStorage.setItem('authToken', response.token);
            const decodeToken = this.decodeToken(response.token);
            if (decodeToken) {
              localStorage.setItem('userRole', decodeToken.role);
              localStorage.setItem('userId', decodeToken.id);
              if (decodeToken.firstName) {
                localStorage.setItem('userFirstName', decodeToken.firstName);
              }
            }
            this.setLoggedIn(true);
          }
        }),
        catchError((error) => {
          this.setLoggedIn(false);
          throw error;
        })
      );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userFirstName');
    this.setLoggedIn(false);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  getRole(): 'user' | 'admin' | null {
    const role = localStorage.getItem('userRole');
    if (role === 'user' || role === 'admin') {
      return role;
    }
    return null;
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  getFirstName(): string | null {
    return localStorage.getItem('userFirstName');
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private setLoggedIn(value: boolean): void {
    this._isLoggedIn.next(value);
  }

  private decodeToken(token: string): any | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token');
      return null;
    }
  }
}
