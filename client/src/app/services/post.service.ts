import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';
import { Post } from '../models/post.model';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPosts(): Observable<Post[]> {
    const mockPosts: Post[] = [
      {
        id: '1',
        slug: 'lancamento-nvidia-rtx-5090',
        title: 'Lançamento da NVIDIA RTX 5090: O Que Esperar?',
        content:
          'Detalhes sobre a próxima geração de placas de vídeo da NVIDIA...',
        imageUrl: 'https://placehold.co/600x400/007bff/ffffff?text=RTX+5090',
        author: { id: 'auth1', username: 'TechGuru' },
        category: { id: 'cat1', name: 'Placas de Vídeo' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        slug: 'analise-amd-ryzen-9000',
        title: 'Análise Completa: Processadores AMD Ryzen Série 9000',
        content:
          'Uma olhada aprofundada nos novos CPUs da AMD e seu desempenho...',
        imageUrl: 'https://placehold.co/600x400/28a745/ffffff?text=Ryzen+9000',
        author: { id: 'auth2', username: 'HardwareMaster' },
        category: { id: 'cat2', name: 'Processadores' },
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '3',
        slug: 'ssd-nvme-pcie5-vale-a-pena',
        title: 'SSDs NVMe PCIe 5.0: Vale a Pena o Upgrade Agora?',
        content:
          'Explorando os benefícios e custos dos SSDs de última geração...',
        imageUrl:
          'https://placehold.co/600x400/ffc107/000000?text=PCIe+5.0+SSD',
        author: { id: 'auth1', username: 'TechGuru' },
        category: { id: 'cat3', name: 'Armazenamento' },
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];
    return of(mockPosts);
    // return this.http.get<Post[]>(`${this.apiUrl}/posts`);
  }

  getPostBySlug(slug: string): Observable<Post | undefined> {
    return this.getPosts().pipe(
      map((posts) => posts.find((post) => post.slug === slug))
    );
    // return this.http.get<Post>(`${this.apiUrl}/posts/${slug}`);
  }
}
