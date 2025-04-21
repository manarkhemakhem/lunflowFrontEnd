import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, map, tap } from 'rxjs/operators';
import { DatabaseService } from './database.service';

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  creationDate: string; // Matches LocalDateTime serialized as ISO 8601 string
  dateTimeModification: string;
  enterPassword: boolean;
  administrator: boolean;
  password: string;
  lastCollabId: string;
  lastCollabFullName: string;
  lastCollabTitle: string;
  lastCollabGroupId: string;
  lastCollabGroupLabel: string;
  tabCollaborator: string[];
  langue: string;
  confirmed: boolean;
  verificationId: string;
  showHelp: boolean;
  needChangePassword: boolean;
  updatePassword: boolean;
  blocked: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
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
        tap(dbName => console.log(`UserService: Database changed to '${dbName}'`))
      )
      .subscribe(dbName => {
        this.databaseNameSubject.next(dbName);
        console.log(`UserService: Updated databaseNameSubject to '${dbName}'`);
      });
  }

  private get apiUrl(): string {
    const databaseName = this.databaseNameSubject.getValue();
    if (!databaseName) {
      console.error('UserService: No database selected. API call blocked.');
      throw new Error('No database selected.');
    }
    console.log(`UserService: Constructing API URL with database '${databaseName}'`);
    return `${this.baseUrl}/${databaseName}/users`;
  }

  getAllUsers(): Observable<User[]> {
    const url = `${this.apiUrl}/all`;
    return this.http.get<User[]>(url).pipe(
      tap(data => console.log(`UserService: Fetched ${data.length} users from ${url}`)),
      catchError(error => this.handleError(error, url))
    );
  }

  getUserById(id: string): Observable<User> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<User>(url).pipe(
      tap(() => console.log(`UserService: Fetched user ${id} from ${url}`)),
      catchError(error => this.handleError(error, url))
    );
  }

  getConfirmedUsers(): Observable<User[]> {
    const url = `${this.apiUrl}/confirmed`;
    return this.http.get<User[]>(url).pipe(
      tap(data => console.log(`UserService: Fetched ${data.length} confirmed users from ${url}`)),
      catchError(error => this.handleError(error, url))
    );
  }

  getNotConfirmedUsers(): Observable<User[]> {
    const url = `${this.apiUrl}/NotConfirmed`;
    return this.http.get<User[]>(url).pipe(
      tap(data => console.log(`UserService: Fetched ${data.length} not confirmed users from ${url}`)),
      catchError(error => this.handleError(error, url))
    );
  }

  getBlockedUsers(): Observable<User[]> {
    const url = `${this.apiUrl}/blocked`;
    return this.http.get<User[]>(url).pipe(
      tap(data => console.log(`UserService: Fetched ${data.length} blocked users from ${url}`)),
      catchError(error => this.handleError(error, url))
    );
  }

  getNotBlockedUsers(): Observable<User[]> {
    const url = `${this.apiUrl}/notBlocked`;
    return this.http.get<User[]>(url).pipe(
      tap(data => console.log(`UserService: Fetched ${data.length} not blocked users from ${url}`)),
      catchError(error => this.handleError(error, url))
    );
  }

  getAdminUsers(): Observable<User[]> {
    const url = `${this.apiUrl}/administrator`;
    return this.http.get<User[]>(url).pipe(
      tap(data => console.log(`UserService: Fetched ${data.length} admin users from ${url}`)),
      catchError(error => this.handleError(error, url))
    );
  }

  getNonAdminUsers(): Observable<User[]> {
    const url = `${this.apiUrl}/notadministrator`;
    return this.http.get<User[]>(url).pipe(
      tap(data => console.log(`UserService: Fetched ${data.length} non-admin users from ${url}`)),
      catchError(error => this.handleError(error, url))
    );
  }

  getDateCreation(): Observable<Date[]> {
    const url = `${this.apiUrl}/dateCreation`;
    return this.http.get<string[]>(url).pipe(
      map(dates => dates.map(date => new Date(date))), // Parse ISO 8601 strings
      tap(() => console.log(`UserService: Fetched creation dates from ${url}`)),
      catchError(error => this.handleError(error, url))
    );
  }

  private handleError(error: HttpErrorResponse, url: string): Observable<never> {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      errorMessage = `Server error - Code: ${error.status}, Message: ${error.message}, URL: ${url}`;
    }
    console.error(`UserService: ${errorMessage}`);
    return throwError(() => new Error(errorMessage));
  }
}
