import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService } from '../services/database.service';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Importer MatDialog ici
import { MatIconModule } from '@angular/material/icon';  // Importer MatIconModule

@Component({
  selector: 'app-database',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatOptionModule,
    MatDialogModule
  ]
  ,
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.css']
})
export class DatabaseComponent implements OnInit {
  databases: any[] = [];
  selectedDatabase = '';
  selectedCollection = '';
  data: any[] = [];
  connectionStatus = '';
  dialogOpened = false; // Flag pour savoir si le dialog est ouvert

  constructor(
    private databaseService: DatabaseService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadDatabases();
  }

  loadDatabases() {
    this.databaseService.getAllDatabases().subscribe((res) => {
      this.databases = res;
    });
  }

  testConnection() {
    if (this.selectedDatabase) {
      this.databaseService.testConnection(this.selectedDatabase).subscribe(
        res => this.connectionStatus = res,
        err => this.connectionStatus = 'Erreur de connexion'
      );
    }
  }

  loadCollectionData() {
    if (this.selectedDatabase && this.selectedCollection) {
      this.databaseService.getCollectionData(this.selectedDatabase, this.selectedCollection).subscribe(
        res => this.data = res
      );
    }
  }

  // Ouvrir le dialog pour sélectionner la base de données
  openDatabaseDialog() {
    this.dialogOpened = true;
  }

  // Sélectionner une base de données et fermer le dialog
  selectDatabase(database: string) {
    this.selectedDatabase = database;
    this.databaseService.setSelectedDatabase(database); // <- Ajout ici
    this.dialogOpened = false;  // Ferme le dialog
  }


  // Fermer le dialog sans choisir de base
  closeDialog() {
    this.dialogOpened = false;
  }
}
