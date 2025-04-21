import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, tap } from 'rxjs/operators';
import { Collaborator } from './collaborator.service';
import { DatabaseService } from './database.service';

export interface Group {
  _id: string;
  label: string;
  address: string;
  idLogo: string;
  collabIdList: string[];
  adminIdList: string[];
  createdBy: string;
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
  private baseUrl = 'http://localhost:8080/api';
  private databaseNameSubject = new BehaviorSubject<string>('');
  databaseName$: Observable<string> = this.databaseNameSubject.asObservable();

  constructor(
    private http: HttpClient,
    private databaseService: DatabaseService
  ) {
    this.databaseService.selectedDatabase$
      .pipe(
        filter(db => !!db),
        tap(dbName => console.log(`GroupService: Database changed to '${dbName}'`))
      )
      .subscribe(dbName => {
        this.databaseNameSubject.next(dbName);
      });
  }

  private get apiUrl(): string {
    const databaseName = this.databaseNameSubject.getValue();
    if (!databaseName) {
      console.error('GroupService: No database selected. API call blocked.');
      throw new Error('No database selected.');
    }
    console.log(`GroupService: Using API URL with database '${databaseName}'`);
    return `${this.baseUrl}/${databaseName}/groups`;
  }

  getAllGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.apiUrl}/all`).pipe(
      tap(data => console.log(`GroupService: Fetched ${data.length} groups from ${this.apiUrl}/all`)),
      catchError(this.handleError)
    );
  }

  getGroupById(id: string): Observable<Group> {
    return this.http.get<Group>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log(`GroupService: Fetched group ${id} from ${this.apiUrl}/${id}`)),
      catchError(this.handleError)
    );
  }

  getCollaboratorsByGroup(groupId: string): Observable<Collaborator[]> {
    return this.http.get<Collaborator[]>(`${this.apiUrl}/${groupId}/collaborators`).pipe(
      tap(() => console.log(`GroupService: Fetched collaborators for group ${groupId} from ${this.apiUrl}/${groupId}/collaborators`)),
      catchError(this.handleError)
    );
  }

  getNbWorkflowTypeByGroupId(groupId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/${groupId}/nbwrkftype`).pipe(
      tap(() => console.log(`GroupService: Fetched workflow types for group ${groupId} from ${this.apiUrl}/${groupId}/nbwrkftype`)),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      errorMessage = `Server error - Code: ${error.status}, Message: ${error.message}`;
    }
    console.error(`GroupService: ${errorMessage}`);
    return throwError(() => new Error(errorMessage));
  }
}
