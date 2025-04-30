import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface Database {
  name: string;
  uri: string;
}

interface ValueType {
  stringValue?: string;
  intValue?: number;
  boolValue?: boolean;
  dateValue?: string;
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

  // Get field names for a specified collection
  getFieldNames(collectionName: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/fields/${collectionName}`);
  }
// Filter data by field, operator, and value
filterByField(
  databaseName: string,
  collection: string,
  field: string,
  operator: string,
  value: string
): Observable<any[]> {
  let params = new HttpParams()
    .set('collection', collection)
    .set('field', field)
    .set('operator', operator)
    .set('value', value);
  return this.http.get<any[]>(`${this.apiUrl}/${databaseName}/filter`, { params });
}
}
