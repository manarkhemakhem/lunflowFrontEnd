import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { switchMap, filter } from 'rxjs/operators';
import { DatabaseService } from './database.service';

export interface Collaborator {
  id: string;
  fullname: string;
  title: string;
  email: string;
  groupId: string;
  userId: string;
  admin: boolean;
  idPicture: string;
  deleted: boolean;
  onLine: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CollaboratorService {
  private baseUrl = 'http://localhost:8080/api';
  private databaseName: string = '';

  constructor(
    private http: HttpClient,
    private databaseService: DatabaseService
  ) {
    this.databaseService.selectedDatabase$
      .pipe(filter(db => !!db)) // Ignore les valeurs vides
      .subscribe((dbName) => {
        console.log('Base de données sélectionnée dans le service :', dbName);
        this.databaseName = dbName;

      });
  }

  private get apiUrl(): string {

    if (!this.databaseName) {

      console.error('Aucune base de données sélectionnée dans le service');
    }

    return `${this.baseUrl}/${this.databaseName}/collaborators`;
  }

  // ⚙️ Méthodes inchangées mais utilisent this.apiUrl

  getAllCollaborators(): Observable<Collaborator[]> {
    return this.http.get<Collaborator[]>(this.apiUrl);
  }

  getCollaboratorById(id: string): Observable<Collaborator> {
    return this.http.get<Collaborator>(`${this.apiUrl}/${id}`);
  }

  deleteCollaborator(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAllAdmin(): Observable<Collaborator[]> {
    return this.http.get<Collaborator[]>(`${this.apiUrl}/Admin`);
  }

  getAllNotAdmin(): Observable<Collaborator[]> {
    return this.http.get<Collaborator[]>(`${this.apiUrl}/NotAdmin`);
  }

  getCollaboratorsByGroup(groupId: string): Observable<Collaborator[]> {
    return this.http.get<Collaborator[]>(`${this.apiUrl}/group/${groupId}`);
  }

  getCreationDatesHistogram(): Observable<{ [date: string]: number }> {
    return this.http.get<{ [date: string]: number }>(`${this.apiUrl}/histogram`);
  }

  getCollaboratorsOnline(): Observable<Collaborator[]> {
    return this.http.get<Collaborator[]>(`${this.apiUrl}/onLine`);
  }

  getCollaboratorsOffline(): Observable<Collaborator[]> {
    return this.http.get<Collaborator[]>(`${this.apiUrl}/offLine`);
  }

  getAllCollaboratorsDeletedStatus(): Observable<Map<string, boolean>> {
    return this.http.get<Map<string, boolean>>(`${this.apiUrl}/deleted`);
  }

  searchByFullname(fullname: string): Observable<Collaborator[]> {
    if (!fullname.trim()) throw new Error("Le nom ne peut pas être vide ou null");
    return this.http.get<Collaborator[]>(`${this.apiUrl}/search?fullname=${fullname.trim()}`);
  }
  // New methods for missing endpoints
  getCollaboratorFieldNames(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/fields`);
  }

  countByField(fieldName: string): Observable<{ [key: string]: number }> {
    if (!fieldName.trim()) throw new Error("Field name cannot be empty or null");
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/count-by-field/${encodeURIComponent(fieldName.trim())}`);
  }
}
