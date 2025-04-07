import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  creationDate: Date;
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

  private apiUrl = 'http://localhost:8080/api/users'; // Change selon ton backend

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/all`);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  getConfirmedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/confirmed`);
  }

  getNotConfirmedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/NotConfirmed`);
  }

  getBlockedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/blocked`);
  }

  getNotBlockedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/notBlocked`);
  }

  getAdminUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/administrator`);
  }

  getNonAdminUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/notadministrator`);
  }
  getDateCreation(): Observable<Date[]> {
    return this.http.get<string[]>(`${this.apiUrl}/dateCreation`)
      .pipe(
        map(dates => dates.map(date => new Date(date))) // Convertir les dates sous forme de chaîne en objets Date
      );
}
}
