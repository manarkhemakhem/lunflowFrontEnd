import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

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
  private apiUrl = 'http://localhost:8080/api/collaborators';

  constructor(private http: HttpClient) {}

  // Récupérer tous les collaborateurs
  getAllCollaborators(): Observable<Collaborator[]> {
    return this.http.get<Collaborator[]>(this.apiUrl);
  }

  // Récupérer un collaborateur par ID
  getCollaboratorById(id: string): Observable<Collaborator> {
    return this.http.get<Collaborator>(`${this.apiUrl}/${id}`);
  }

  // Supprimer un collaborateur par ID
  deleteCollaborator(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAllAdmin(): Observable<Collaborator[]> {
    console.log("Appel à l'API des administrateurs");

    return this.http.get<Collaborator[]>(`${this.apiUrl}/Admin`).pipe(
      tap(data => {
        console.log('Données des administrateurs récupérées:');
        data.forEach(collaborator => {
          console.log(`Collaborator: ${collaborator.fullname}, admin: ${collaborator.admin}`);
        });
      }));}

  // Récupérer tous les non-administrateurs
  getAllNotAdmin(): Observable<Collaborator[]> {
    return this.http.get<Collaborator[]>(`${this.apiUrl}/NotAdmin`);
  }

  // Récupérer les collaborateurs par groupId
  getCollaboratorsByGroup(groupId: string): Observable<Collaborator[]> {
    return this.http.get<Collaborator[]>(`${this.apiUrl}/group/${groupId}`);
  }
  // Get histogram data (Collaborators creation dates)
  getCreationDatesHistogram(): Observable<{ [date: string]: number }> {
    return this.http.get<{ [date: string]: number }>(`${this.apiUrl}/histogram`);
  }


    getCollaboratorsByGroupId(groupId: string): Observable<Collaborator[]> {
      return this.http.get<Collaborator[]>(`${this.apiUrl}/group/${groupId}`);
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
  if (!fullname.trim()) {
    throw new Error("Le nom ne peut pas être vide ou null");
  }

  return this.http.get<Collaborator[]>(`${this.apiUrl}/search?fullname=${fullname.trim()}`);
}

}
