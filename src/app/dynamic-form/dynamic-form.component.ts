import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

/* import { CollaboratorService } from '../services/collaborator.service';
 */import { UserService } from '../services/user.service';
import { GroupService } from '../services/group.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as echarts from 'echarts';


import { HeaderComponent } from "../header/header.component";
import { HttpClient } from '@angular/common/http';
import { DatabaseService } from '../services/database.service';


@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.css']
})
export class DynamicFormComponent implements OnInit {
  collections: string[] = ['group', 'user', 'collaborator'];
  selectedCollection = '';
  collectionData: any[] = [];
  fieldNames: string[] = [];
  selectedField = '';
  valueForPercentage = '';

  groupedCountResult: { [key: string]: number } = {};
  countResult: number | null = null;
  percentageResult: number | null = null;
  totalCount: number | null = null;
  existingValues: string[] = [];

  constructor(
    private databaseService: DatabaseService,
   //rivate collaboratorService: CollaboratorService
  ) {}

  ngOnInit(): void {}
  onCollectionSelect(): void {
    if (!this.selectedCollection) return;

    this.databaseService.getCollectionData('maBaseUnique', this.selectedCollection).subscribe(
      data => {
        this.collectionData = data;
      },
      (error: any) => {
        console.error('Erreur collection', error);
      }
    );


   /*  if (this.selectedCollection === 'collaborator') {
      this.collaboratorService.getCollaboratorFieldNames().subscribe(fields => {
        this.fieldNames = fields;
      });
    } else {
      this.fieldNames = [];
    }

    this.selectedField = '';
  }
 */
/*   onFieldChange(): void {
  } */
}}
