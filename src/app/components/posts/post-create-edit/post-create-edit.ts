import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PostService } from '../../../services/post.service';
import { Category, Post, PostPayload } from '../../../models/post.model';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
@Component({
  selector: 'app-post-create-edit',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    QuillModule,
  ],
  templateUrl: './post-create-edit.html',
  styleUrl: './post-create-edit.css',
})
export class PostCreateEdit implements OnInit {
  postForm!: FormGroup;
  categories: Category[] = [];
  selectedFile: File | null = null;
  isLoading: boolean = false;
  apiError: string | null = null;
  isEditMode: boolean = false;
  postId: string | null = null;
  currentPost: Post | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  quillConfig: QuillModule = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'], // negrito, itálico, sublinhado, tachado
      ['blockquote', 'code-block'], // bloco de citação, bloco de código

      [{ header: 1 }, { header: 2 }], // títulos
      [{ list: 'ordered' }, { list: 'bullet' }], // listas ordenadas/não ordenadas
      [{ script: 'sub' }, { script: 'super' }], // subscrito/sobrescrito
      [{ indent: '-1' }, { indent: '+1' }], // recuo/avançar recuo
      [{ direction: 'rtl' }], // direção do texto

      [{ size: ['small', false, 'large', 'huge'] }], // tamanhos de fonte personalizados
      [{ header: [1, 2, 3, 4, 5, 6, false] }], // todos os títulos

      [{ color: [] }, { background: [] }], // cores de texto e fundo
      [{ font: [] }], // fontes
      [{ align: [] }], // alinhamento

      ['clean'], // remover formatação

      ['link', 'image', 'video'], // link, imagem, vídeo
    ],
  };

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();

    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.isEditMode = true;
        this.loadPostForEdit(slug);
      }
    });
  }

  initForm(): void {
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      categoryId: [null, Validators.required],
      image: [null],
    });
  }

  loadCategories(): void {
    this.postService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Erro ao carregar categorias:', error);
        this.apiError = 'Erro ao carregar categorias. Tente novamente.';
      },
    });
  }

  loadPostForEdit(slug: string): void {
    this.isLoading = true;
    this.postService
      .getPostBySlug(slug)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (post: Post | null) => {
          if (post) {
            this.currentPost = post;
            this.postId = post.id;
            this.postForm.patchValue({
              title: post.title,
              content: post.content,
              categoryId: post.category ? post.category.id : null,
            });
            this.imagePreview = post.imageUrl;
          } else {
            console.error(`Post com slug '${slug}' não encontrado.`);
            this.apiError = 'Post não encontrado para edição.';
            this.router.navigate(['/']); // Redireciona para a home
          }
        },
        error: (error) => {
          console.error('Erro ao carregar post para edição:', error);
          this.apiError =
            error.error?.message || 'Erro ao carregar post para edição.';
          this.router.navigate(['/']); // Redireciona em caso de erro na API
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.selectedFile = null;
      this.imagePreview = null;
    }
    if (this.postForm.get('image')) {
      this.postForm.get('image')?.setErrors(null);
    }
  }

  onSubmit(): void {
    if (!this.isEditMode && !this.selectedFile) {
      this.postForm.get('image')?.setErrors({ required: true });
    }

    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      this.apiError =
        'Por favor, preencha todos os campos obrigatórios corretamente.';
      return;
    }

    this.isLoading = true;
    this.apiError = null;

    const { title, content, categoryId } = this.postForm.value;
    const postPayload: PostPayload = {
      title,
      content,
      categoryId: categoryId || null,
    };

    if (this.isEditMode && this.postId) {
      this.postService
        .updatePost(this.postId, postPayload, this.selectedFile || undefined)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => {
            this.router.navigate(['/']);
          },
          error: (error) => {
            console.error('Erro ao atualizar post:', error);
            this.apiError =
              error.error?.message ||
              'Erro ao atualizar post. Tente novamente.';
          },
        });
    } else {
      if (!this.selectedFile) {
        this.apiError = 'Por favor, selecione uma imagem para o post.';
        this.isLoading = false;
        return;
      }
      this.postService
        .createPost(postPayload, this.selectedFile)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => {
            this.router.navigate(['/']);
          },
          error: (error) => {
            console.error('Erro ao criar post:', error);
            this.apiError =
              error.error?.message || 'Erro ao criar post. Tente novamente.';
          },
        });
    }
  }
}
