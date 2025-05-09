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

  getFieldNames(collectionName: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/fields/${collectionName}`);
  }

  getFields(databaseName: string, collection: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${databaseName}/${collection}/fields`);
  }

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

  filterByFields(
    databaseName: string,
    collection: string,
    filters: { field: string, operator: string, value: string }[]
  ): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/${databaseName}/${collection}/filter`, filters);
  }

  filterFieldValues(
    databaseName: string,
    collection: string,
    field: string,
    filter: boolean,
    operator?: string,
    value?: string,
    filterField?: string
  ): Observable<any[]> {
    const url = `${this.apiUrl}/${databaseName}/${collection}/field-values/${field}`;
    console.log('filterFieldValues: Requesting URL:', url);
    return this.http.get<any[]>(url);
    // Note : Si votre backend sur 8080 supporte le filtrage conditionnel, décommentez le code suivant :
    /*
    let params = new HttpParams()
      .set('databaseName', databaseName)
      .set('collection', collection)
      .set('field', field)
      .set('filter', filter.toString());

    if (filter) {
      if (!operator || !value || !filterField) {
        throw new Error('Operator, value, and filterField are required when filter is true');
      }
      params = params
        .set('operator', operator)
        .set('value', value)
        .set('filterField', filterField);
    }

    return this.http.get<any[]>(`${this.apiUrl}/filter-field`, { params });
    */
  }
}
