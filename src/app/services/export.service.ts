import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  private apiUrl = 'http://localhost:8080/export/pdf'; // Corrected URL

  constructor(private http: HttpClient) {}

  exportToPdf(payload: { content: string; title: string; image?: Blob }, filename: string): Observable<Blob> {
    const formData = new FormData();
    formData.append('content', payload.content);
    formData.append('title', payload.title);
    formData.append('filename', filename);
    if (payload.image) {
      formData.append('image', payload.image, 'chart.png');
    }

    return this.http
      .post(this.apiUrl, formData, { responseType: 'blob' })
      .pipe(
        catchError((error) => {
          console.error('Erreur HTTP lors de l’exportation PDF:', error);
          return throwError(() => new Error('Erreur lors de la génération du PDF'));
        })
      );
  }
}
