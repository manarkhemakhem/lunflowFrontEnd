import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Collaborator, CollaboratorService } from '../collaborator.service';
import { RouterModule } from '@angular/router';
import * as echarts from 'echarts';
import { NgxEchartsModule } from 'ngx-echarts';
import { HeaderComponent } from "../header/header.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NgxEchartsModule, HeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  @ViewChild('barChart', { static: true }) barChartElement!: ElementRef;
  @ViewChild('donutChart', { static: true }) donutChartElement!: ElementRef;

  totalCollaborators: number = 0;
  totalAdmins: number = 0;
  totalNotAdmins: number = 0;
  collaborators: Collaborator[] = [];
  admins: Collaborator[] = [];
  notAdmins: Collaborator[] = [];

  groupStats: { groupName: string, count: number }[] = []; // Nouvelle propriété pour les stats par groupe

  constructor(private collaboratorService: CollaboratorService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Après que la vue a été initialisée, on peut maintenant mettre à jour les graphiques
    this.checkAndUpdateCharts();
  }

  loadDashboardData(): void {
    // Charger tous les collaborateurs
    this.collaboratorService.getAllCollaborators().subscribe(
      data => {
        this.collaborators = data;
        this.totalCollaborators = this.collaborators.length;
        this.groupStats = this.calculateGroupStats();  // Calculer les stats par groupe
        this.checkAndUpdateCharts();  // Vérifiez et mettez à jour les graphiques après chaque chargement
      },
      error => {
        console.error('Erreur lors du chargement des collaborateurs:', error);
      }
    );

    // Charger tous les administrateurs
    this.collaboratorService.getAllAdmin().subscribe(
      data => {
        this.admins = data;
        this.totalAdmins = this.admins.length;
        this.checkAndUpdateCharts();
      },
      error => {
        console.error('Erreur lors du chargement des administrateurs:', error);
      }
    );

    // Charger tous les non-administrateurs
    this.collaboratorService.getAllNotAdmin().subscribe(
      data => {
        this.notAdmins = data;
        this.totalNotAdmins = this.notAdmins.length;
        this.checkAndUpdateCharts();
      },
      error => {
        console.error('Erreur lors du chargement des non-administrateurs:', error);
      }
    );
  }

  // Calculer les statistiques des groupes (par groupId)
  calculateGroupStats(): { groupName: string, count: number }[] {
    const groupMap = new Map<string, number>();

    // Si vous avez un service qui retourne les groupes avec des noms, vous pouvez l'utiliser ici
    this.collaborators.forEach(collab => {
      const groupId = collab.groupId; // Vous pouvez adapter cette logique en fonction de la structure de vos données
      groupMap.set(groupId, (groupMap.get(groupId) || 0) + 1);
    });

    // Convertir les données du groupe en un tableau pour l'affichage
    return Array.from(groupMap.entries()).map(([groupId, count]) => ({
      groupName: `Groupe ${groupId}`,  // Remplacez par un nom plus lisible si disponible
      count: count
    }));
  }

  // Vérifier que les données sont disponibles avant de mettre à jour les graphiques
  checkAndUpdateCharts(): void {
    // Si toutes les données sont disponibles
    if (this.totalCollaborators > 0 && this.totalAdmins >= 0 && this.totalNotAdmins >= 0) {
      this.updateCharts(); // Mettre à jour les graphiques avec les nouvelles données
      this.updateDonutChart(); // Mettre à jour également le graphique en donut
    }
  }

  // Fonction pour mettre à jour le graphique en barres
  updateCharts(): void {
    if (!this.barChartElement) {
      console.log('Element du graphique non trouvé');
      return;  // Si l'élément du graphique n'est pas encore disponible, quitter
    }

    const barChart = echarts.init(this.barChartElement.nativeElement);
    console.log('Graphique initialisé');

    const option = {
      title: {
        text: 'Répartition des Collaborateurs',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        top: '10%',
        left: 'center',
        data: ['Total', 'Admins', 'Non-Admins']
      },
      xAxis: {
        type: 'category',
        data: ['Total Collaborators', 'Admins', 'Non-Admins']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: 'Nombre',
          type: 'bar',
          data: [this.totalCollaborators, this.totalAdmins, this.totalNotAdmins],
          color: '#4CAF50' // Vous pouvez changer la couleur des barres si vous le souhaitez
        }
      ]
    };

    barChart.setOption(option);
    console.log('Options appliquées au graphique');
  }

  // Fonction pour mettre à jour le graphique en donut (répartition des collaborateurs par groupe)
  updateDonutChart(): void {
    if (!this.donutChartElement) {
      console.log('Element du graphique donut non trouvé');
      return; // Si l'élément du graphique en donut n'est pas encore disponible, quitter
    }

    const donutChart = echarts.init(this.donutChartElement.nativeElement);

    // Créez un tableau pour les données du donut (groupe et nombre de collaborateurs)
    const donutData = this.groupStats.map(group => ({
      value: group.count,
      name: group.groupName // Utilisez le nom du groupe
    }));

    const option = {
      title: {
        text: 'Répartition des Collaborateurs par Groupe',
        left: 'center',
        top: '20px'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      series: [
        {
          name: 'Répartition par Groupe',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'outside',
          },
          labelLine: {
            show: true
          },
          data: donutData,
          color: ['#ff99cc', '#ffcc00', '#4caf50', '#f44336', '#2196f3'] // Couleurs personnalisées
        }
      ]
    };

    donutChart.setOption(option);
  }
}
