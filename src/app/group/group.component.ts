import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Collaborator, CollaboratorService } from '../collaborator.service';
import { GroupService, Group } from '../group.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from "../header/header.component";
import * as echarts from 'echarts';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css']
})
export class GroupComponent implements OnInit, AfterViewInit {

  @ViewChild('collaboratorsChart', { static: false }) chartElement!: ElementRef;
  groups: Group[] = [];
  totalGroups: number = 0;
  collaboratorsCountByGroup: { groupLabel: string, count: number }[] = [];  // Remplacer `groupId` par `groupLabel`
  errorMessage: string = '';  // Déclaration de errorMessage pour gérer les erreurs

  constructor(
    private groupService: GroupService,
    private collaboratorService: CollaboratorService
  ) {}

  ngOnInit(): void {
    // Récupérer tous les groupes au démarrage
    this.groupService.getAllGroups().subscribe(
      (data) => {
        this.groups = data;
        this.totalGroups = data.length;
        // Charger les collaborateurs pour chaque groupe
      },
      (error) => {
        this.errorMessage = 'Erreur lors de la récupération des groupes';
        console.error('Erreur:', error);
      }
    );
  }

  ngAfterViewInit(): void {

  }
  
}
