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
  currentPage: number = 1;  // Page actuelle
  itemsPerPage: number = 5;  // Nombre d'éléments par page
  totalPages: number = 1;  // Nombre total de pages
  paginatedGroups: Group[] = [];  // Liste des groupes à afficher pour la page actuelle

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
        this.totalPages = Math.ceil(this.totalGroups / this.itemsPerPage);
        this.paginateData();
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
  // Méthode pour gérer la pagination
  paginateData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedGroups = this.groups.slice(startIndex, endIndex);
  }

  // Méthode pour aller à la page suivante
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateData();
    }
  }

  // Méthode pour revenir à la page précédente
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateData();
    }
  }
}
