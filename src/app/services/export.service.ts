import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  private baseUrl: string = 'http://localhost:8080/export';  // L'URL de base du backend

  constructor(private http: HttpClient) { }

  exportToPDF(title: string, content: string, filename: string, images: File[]): Observable<Blob> {
    const formData: FormData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('filename', filename);

    // Always append the 'images' part, even if empty
    if (images.length > 0) {
      images.forEach(image => {
        formData.append('images', image, image.name);
      });
    } else {
      // Append an empty file or placeholder to satisfy the backend
      formData.append('images', new Blob(), 'empty');
    }

    const headers = new HttpHeaders();

    return this.http.post(`${this.baseUrl}/export`, formData, {
      headers: headers,
      responseType: 'blob'
    });
  }}
