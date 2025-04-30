import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { DatabaseService } from '../../services/database.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-database-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatOptionModule
  ],  templateUrl: './database-dialog.component.html',
  styleUrl: './database-dialog.component.css'
})
export class DatabaseDialogComponent implements OnInit {
  databases: any[] = [];
  selectedDatabase: string = '';
  connectionStatus: string = '';

  constructor(
    private databaseService: DatabaseService,
    public dialogRef: MatDialogRef<DatabaseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
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

  selectDatabase() {
    if (this.selectedDatabase) {
      this.dialogRef.close(this.selectedDatabase);
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
