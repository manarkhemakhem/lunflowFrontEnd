import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService } from '../services/database.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-database',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.css']
})
export class DatabaseComponent  implements OnInit {

  databases: { name: string; uri: string }[] = [];
  selectedDatabase: string = '';
  selectedCollection: string = '';
  collectionData: any[] = [];
  connectionMessage: string = '';

  constructor(private databaseService: DatabaseService) {}

  ngOnInit(): void {
    // Récupérer les bases de données disponibles
    this.databaseService.getDatabases().subscribe(
      (data) => {
        this.databases = data;
      },
      (error) => {
        console.error('Error fetching databases', error);
      }
    );
  }

  // Tester la connexion à la base de données sélectionnée
  onDatabaseSelect(): void {
    if (this.selectedDatabase) {
      this.databaseService.testConnection(this.selectedDatabase).subscribe(
        (message) => {
          this.connectionMessage = message;
          if (message.includes('successful')) {
            console.log(`Successfully connected to ${this.selectedDatabase}`);
          }
        },
        (error) => {
          this.connectionMessage = 'Connection failed';
          console.error('Connection failed', error);
        }
      );
    }
  }

  // Récupérer les données de la collection sélectionnée
  onCollectionSelect(): void {
    if (this.selectedDatabase && this.selectedCollection) {
      this.databaseService.getCollectionData(this.selectedDatabase, this.selectedCollection).subscribe(
        (data) => {
          this.collectionData = data;
        },
        (error) => {
          console.error('Error fetching collection data', error);
        }
      );
    }
  }
  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
