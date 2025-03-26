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
    this.groupService.getAllGroups().subscribe(
      (data) => {
        this.groups = data;
        this.totalGroups = data.length;

        this.loadCollaboratorsData();

      },

      (error) => {
        this.errorMessage = 'Erreur lors de la récupération des groupes';
        console.error('Erreur:', error);
      }
    );
  }
  ngAfterViewInit(): void {
    if (typeof window !== 'undefined')
    {this.loadChart();}
    setTimeout(() => {
      this.loadChart();
    }, 500);
  }

  // Méthode pour charger les données des collaborateurs par groupe
  loadCollaboratorsData(): void {
    this.collaboratorsCountByGroup = this.groups.map(group => ({
      groupLabel: group.label,
      count: group.nbCollabs  // Utiliser directement nbCollabs des groupes
    }));

  }
  loadChart(): void {
    const chart = echarts.init(this.chartElement.nativeElement);
    const option = {
      title: {
        text: 'Répartition des Collaborateurs par Groupe',
        left: 'center'
      },
      tooltip: {
        trigger: 'item'
      },
      xAxis: {
        type: 'category',
        data: this.collaboratorsCountByGroup.map(item => item.groupLabel),
        axisLabel: {
          rotate: 45,
          interval: 0,
          fontSize: 7,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      yAxis: {
        type: 'value',
      },
      series: [{
        data: this.collaboratorsCountByGroup.map(item => item.count),
        type: 'bar',
        color: '#42A5F5',
        barWidth: '60%',  // Agrandir la largeur des barres
        barCategoryGap: '20%',  // Ajouter de l'espace entre les barres
        label: {
          show: true,
          position: 'insideTop',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 12
        }
      }]
    };
    chart.setOption(option);
  }


}
