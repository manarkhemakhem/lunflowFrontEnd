import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface Database {
  name: string;
  uri: string;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private apiUrl = 'http://localhost:8080/api/database';
  private selectedDatabaseSubject = new BehaviorSubject<string>('');
  selectedDatabase$: Observable<string> = this.selectedDatabaseSubject.asObservable();
  constructor(private http: HttpClient) {}
  setSelectedDatabase(databaseName: string): void {
    this.selectedDatabaseSubject.next(databaseName);
    console.log("work in ",this.selectedDatabase$)
  }

  getSelectedDatabase(): string {
    return this.selectedDatabaseSubject.getValue();
  }

 getAllDatabases() {
    return this.http.get<any[]>('http://localhost:8080/api/database/all');
  }

  testConnection(databaseName: string) {
    return this.http.get(`http://localhost:8080/api/database/testConnection/${databaseName}`, { responseType: 'text' });
  }

  getCollectionData(databaseName: string, collectionName: string) {
    return this.http.get<any[]>(`http://localhost:8080/api/database/${databaseName}/${collectionName}`);
  }

}
