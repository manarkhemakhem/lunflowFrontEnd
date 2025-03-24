import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Collaborator } from './collaborator.service';

// Modèle Group
export interface Group {
  _id: string;
  label: string;
  address: string;
  idLogo: string;
  collabIdList: string[]; // Liste des IDs des collaborateurs
  adminIdList: string[];  // Liste des IDs des admins
  createdBy: string;      // ID de l'utilisateur ayant créé le groupe
  nbCollabs: number;
  nbActifCollabs: number;
  nbCollabsMax: number;
  langue: string;
  groupeType: string;
  disableGroup: boolean;
  showLabel: boolean;
  showLogo: boolean;
  nbSpace: number;
  nbWrkftype: number;
  nbTable: number;
  folders: string[];
  folderList: string[];
  dateTimeModification: string;
  nbOfWorkflowTypePublic: number;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiUrl = 'http://localhost:8080/api/groups';

  constructor(private http: HttpClient) { }


  // Récupérer tous les groupes
  getAllGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.apiUrl}/all`).pipe(
      catchError(this.handleError)
    );
  }

  // Récupérer un groupe par son ID
  getGroupById(id: string): Observable<Group> {
    return this.http.get<Group>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  } 

  // Récupérer la liste des collaborateurs d'un groupe
  getCollaboratorList(groupId: string): Observable<string[] | null> {
    return this.http.get<string[]>(`${this.apiUrl}/${groupId}/collaborators`).pipe(
      catchError(this.handleError)
    );
  }

  // Récupérer les détails des collaborateurs à partir de la liste des IDs
  getCollaboratorDetails(collabIds: string[]): Observable<Collaborator[] | null> {
    if (!collabIds || collabIds.length === 0) {
      return throwError('La liste des collaborateurs est vide.');
    }

    return this.http.post<Collaborator[]>(`${this.apiUrl}/collaborators/details`, collabIds).pipe(
      catchError(this.handleError)
    );
  }

  // Gestionnaire d'erreurs pour les appels HTTP
  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur client : ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = `Erreur serveur - Code : ${error.status}, Message : ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
