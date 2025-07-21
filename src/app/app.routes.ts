import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/auth/login/login';
import { Register } from './components/auth/register/register';
import { PostDetail } from './components/posts/post-detail/post-detail';
import { PostCreateEdit } from './components/posts/post-create-edit/post-create-edit';
import { CategoryManagement } from './components/admin/category-management/category-management';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'posts/create', component: PostCreateEdit },
  { path: 'posts/edits/:id', component: PostCreateEdit },
  { path: 'posts/:slug', component: PostDetail },
  { path: 'admin/categories', component: CategoryManagement },
  { path: '**', redirectTo: '' },
];
