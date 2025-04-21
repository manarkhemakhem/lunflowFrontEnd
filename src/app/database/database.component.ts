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
import { DatabaseDialogComponent } from '../database-dialog/database-dialog.component';

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
  selectedDatabase: string = '';
  selectedCollection: string = '';
  data: any[] = [];

  constructor(
    private databaseService: DatabaseService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // No need to load databases; handled in DatabaseDialogComponent
  }

  openDatabaseDialog() {
    const dialogRef = this.dialog.open(DatabaseDialogComponent, {
      height: '400px',
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedDatabase = result;
        this.databaseService.setSelectedDatabase(result);
      }
    });
  }

  /* loadCollectionData() {
    if (this.selectedDatabase && this.selectedCollection) {
      this.databaseService.getCollectionData(this.selectedDatabase, this.selectedCollection).subscribe(
        res => this.data = res
      );
    }
  } */
}
