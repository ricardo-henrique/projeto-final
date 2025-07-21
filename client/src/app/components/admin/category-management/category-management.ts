import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Category } from '../../../models/post.model';
import { PostService } from '../../../services/post.service';
import { finalize } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-category-management',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './category-management.html',
  styleUrl: './category-management.css',
})
export class CategoryManagement implements OnInit {
  categoryForm!: FormGroup; // Formulário para criar/editar categoria
  categories: Category[] = []; // Lista de categorias
  isLoading: boolean = false; // Estado de carregamento geral
  isSubmitting: boolean = false; // Estado de submissão do formulário
  apiError: string | null = null; // Mensagem de erro da API
  successMessage: string | null = null; // Mensagem de sucesso
  editMode: boolean = false; // Indica se estamos editando uma categoria
  currentCategoryId: string | null = null;

  constructor(
    private fb: FormBuilder, // Injeta o FormBuilder
    private postService: PostService // Injeta o PostService (que contém os métodos de categoria)
  ) {}

  ngOnInit(): void {
    this.initForm(); // Inicializa o formulário
    this.loadCategories();
  }

  initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required], // Nome da categoria é obrigatório
    });
  }

  /**
   * Carrega todas as categorias da API.
   */
  loadCategories(): void {
    this.isLoading = true;
    this.apiError = null;
    this.postService
      .getCategories()
      .pipe(
        finalize(() => (this.isLoading = false)) // Garante que isLoading seja false no final
      )
      .subscribe({
        next: (data) => {
          this.categories = data;
        },
        error: (error) => {
          console.error('Erro ao carregar categorias:', error);
          this.apiError =
            error.error?.message ||
            'Erro ao carregar categorias. Tente novamente.';
        },
      });
  }

  /**
   * Lida com a submissão do formulário (criação ou atualização de categoria).
   */
  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched(); // Marca campos como tocados para exibir erros
      this.apiError = 'Por favor, preencha o nome da categoria.';
      return;
    }

    this.isSubmitting = true; // Ativa o estado de submissão
    this.apiError = null;
    this.successMessage = null;

    const categoryName = this.categoryForm.value.name;
    let operation: Observable<Category>;

    if (this.editMode && this.currentCategoryId) {
      // Modo de edição: chama o método de atualização
      operation = this.postService.updateCategory(
        this.currentCategoryId,
        categoryName
      );
    } else {
      // Modo de criação: chama o método de criação
      operation = this.postService.createCategory(categoryName);
    }

    operation
      .pipe(
        finalize(() => (this.isSubmitting = false)) // Finaliza o estado de submissão
      )
      .subscribe({
        next: () => {
          this.successMessage = `Categoria ${
            this.editMode ? 'atualizada' : 'criada'
          } com sucesso!`;
          this.categoryForm.reset(); // Limpa o formulário
          this.onCancelEdit(); // Sai do modo de edição
          this.loadCategories(); // Recarrega a lista de categorias
        },
        error: (error: any) => {
          console.error('Erro na operação de categoria:', error);
          this.apiError =
            error.error?.message ||
            `Erro ao ${
              this.editMode ? 'atualizar' : 'criar'
            } categoria. Tente novamente.`;
        },
      });
  }

  /**
   * Entra no modo de edição e preenche o formulário com os dados da categoria selecionada.
   * @param category A categoria a ser editada.
   */
  onEdit(category: Category): void {
    this.editMode = true;
    this.currentCategoryId = category.id;
    this.categoryForm.patchValue({ name: category.name }); // Preenche o formulário
    this.apiError = null;
    this.successMessage = null;
  }

  /**
   * Deleta uma categoria após a confirmação.
   * @param categoryId O ID da categoria a ser deletada.
   * @param categoryName O nome da categoria para exibição na confirmação.
   */
  onDelete(categoryId: string, categoryName: string): void {
    if (
      confirm(
        `Tem certeza que deseja deletar a categoria "${categoryName}"? Esta ação não pode ser desfeita.`
      )
    ) {
      this.isLoading = true; // Ativa o carregamento para a operação de exclusão
      this.apiError = null;
      this.successMessage = null;

      this.postService
        .deleteCategory(categoryId)
        .pipe(
          finalize(() => (this.isLoading = false)) // Finaliza o carregamento
        )
        .subscribe({
          next: () => {
            this.successMessage = `Categoria "${categoryName}" deletada com sucesso!`;
            this.loadCategories(); // Recarrega a lista de categorias
            this.onCancelEdit(); // Garante que o formulário seja limpo se a categoria deletada estava em edição
          },
          error: (error) => {
            console.error('Erro ao deletar categoria:', error);
            this.apiError =
              error.error?.message ||
              `Erro ao deletar categoria "${categoryName}". Tente novamente.`;
          },
        });
    }
  }

  /**
   * Cancela o modo de edição e limpa o formulário.
   */
  onCancelEdit(): void {
    this.editMode = false;
    this.currentCategoryId = null;
    this.categoryForm.reset(); // Limpa o formulário
    this.apiError = null;
    this.successMessage = null;
  }
}
