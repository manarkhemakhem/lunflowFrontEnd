import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

interface Database {
  name: string;
  uri: string;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private baseUrl = 'http://localhost:8080/database';
  constructor(private http: HttpClient) {}

  // Récupérer toutes les bases de données
  getDatabases(): Observable<Database[]> {
    return this.http.get<Database[]>(`${this.baseUrl}/all`);
  }

  // Tester la connexion avec une base de données spécifique
  testConnection(databaseName: string): Observable<string> {
    return this.http.get<string>(`${this.baseUrl}/testConnection/${databaseName}`, { responseType: 'text' as 'json' });
  }

  // Récupérer les données d'une collection spécifique d'une base de données
  getCollectionData(databaseName: string, collectionName: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${databaseName}/${collectionName}`);
  }
}
