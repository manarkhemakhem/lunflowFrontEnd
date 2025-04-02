import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Collaborator, CollaboratorService } from '../collaborator.service';
import { Router, RouterModule } from '@angular/router';
import * as echarts from 'echarts';
import { HeaderComponent } from "../header/header.component";
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  @ViewChild('DoughnutChart', { static: true })    DoughnutChartElement!: ElementRef;
  @ViewChild('histogramChart', { static: false }) chartElement!: ElementRef;
  @ViewChild('DeletedStatusChartElement', { static: false }) DeletedStatusChartElement!: ElementRef;
  @ViewChild('onlineChart', { static: false }) onlineChart!: ElementRef;



  creationHistogram: { [date: string]: number } = {};
  totalCollaborators: number = 0;
  totalAdmins: number = 0;
  totalNotAdmins: number = 0;
  collaborators: Collaborator[] = [];
  admins: Collaborator[] = [];
  notAdmins: Collaborator[] = [];
  totalDeleted: number = 0;
  totalNotDeleted: number = 0;

  totalOnline: number = 0;
  totalNotOnline: number = 0;


  constructor(private collaboratorService: CollaboratorService, private cdr: ChangeDetectorRef , private router: Router) { }

  ngOnInit(): void {
    if (typeof window !== 'undefined')
    {this.loadDashboardData();}

    this.collaboratorService.getCreationDatesHistogram().subscribe(
      (data) => {
        this.creationHistogram = data;
        this.loadChart();
      },
      (error) => {
        console.error('Erreur lors de la récupération de l’histogramme:', error);
      }
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.checkAndUpdateCharts();
    }, 500);
    if (Object.keys(this.creationHistogram).length > 0) {
      this.loadChart();
    }  }


    private loadChart(): void {
      if (!this.chartElement) return;

      const chartInstance = echarts.init(this.chartElement.nativeElement);
      const dates = Object.keys(this.creationHistogram);
      const values = Object.values(this.creationHistogram);

      const options = {
        title: {
          text: 'Évolution Trimestrielle des Collaborateurs Créés',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '10%',
          right: '5%',
          bottom: '20%'
        },
        xAxis: {
          type: 'category',
          data: dates ,
          axisLabel: {
            interval: 0,
            rotate: 45,
            fontSize: 12
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: 'Nombre de collaborateurs',
            type: 'bar',
            data: values,
            barWidth: '50%',
            color: '#2475bd',
            label: {
              show: true,
              position: 'insideTop',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 12
            }
          }
        ]
      };

      chartInstance.setOption(options);
    }

    loadDashboardData(): void {
      this.collaboratorService.getAllCollaborators().subscribe(data => {
        this.collaborators = data;
        this.totalCollaborators = this.collaborators.length;
        this.collaboratorService.getAllNotAdmin().subscribe(
              (res) => {

                this.totalNotAdmins = res.length;
              }
            );
            this.collaboratorService.getAllAdmin().subscribe(
              (res) => {

                this.totalAdmins = res.length;
              }
            );
            forkJoin({
              online: this.collaboratorService.getCollaboratorsOnline(),
              offline: this.collaboratorService.getCollaboratorsOffline()
            }).subscribe(
              ({ online, offline }) => {
                this.totalOnline = online.length;
                this.totalNotOnline = offline.length;

                // Mettre à jour le graphique après avoir chargé toutes les données
                this.updateOnlineStatusChart();
              },
              error => {
                console.error("Erreur lors du chargement des données du tableau de bord", error);
              }
            );


        this.totalDeleted = this.collaborators.filter(collab => collab.deleted === true).length;
        this.totalNotDeleted = this.collaborators.filter(collab => collab.deleted === false).length;

        this.updateDeletedStatusChart();
        this.updateOnlineStatusChart();
        this.updateDoughnutChart();
      });

  }



  updateDeletedStatusChart(): void {
    if (!this.DeletedStatusChartElement?.nativeElement) return;

    const chart = echarts.init(this.DeletedStatusChartElement.nativeElement);

    const option = {
      title: {
        text: 'État des Collaborateurs',
        left: 'center',
        textStyle: { fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'axis' },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '10%',
        top : '20%'
      },
      xAxis: {
        type: 'category',
        data: ['Supprimés', 'Non Supprimés'],
        axisLabel: { fontSize: 14, fontWeight: 'bold' }
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        type: 'bar',
        data: [
          { value: this.totalDeleted, name: 'Supprimés', itemStyle: { color: '#77b4eb' } },
          { value: this.totalNotDeleted, name: 'Non Supprimés', itemStyle: { color: '#2475bd' } }
        ],
        barWidth: '50%',
        label: {
          show: true,
          position: 'insideTop',
          fontSize: 12,
          fontWeight: 'bold'
        }
      }]
    };

    chart.setOption(option);
  }

  updateOnlineStatusChart(): void {

    if (!this.onlineChart?.nativeElement) return;

    const chart = echarts.init(this.onlineChart.nativeElement);

    const option = {
      title: {
        text: 'État des Collaborateurs',
        left: 'center',
        textStyle: { fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'  // Affiche les données sous forme de pourcentage
      },
      legend: {
        orient: 'horizontal',
        bottom: '3%',
        data: ['En ligne', 'Non En ligne'],
        textStyle: { fontSize: 12, fontWeight: 'bold' }
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          data: [
            { value: this.totalOnline, name: 'En ligne', itemStyle: { color: '#77b4eb' } },
            { value: this.totalNotOnline, name: 'Non En ligne', itemStyle: { color: '#2475bd' } }
          ],
          label: {
            show: true,
            position: 'center',

            fontSize: 12,
            fontWeight: 'bold',
            formatter: '{b}: {c} ({d}%)'
          },
          labelLine: {
            show: true
          }
        }
      ]
    };

    chart.setOption(option);
  }

  checkAndUpdateCharts(): void {
    if (this.totalCollaborators > 0) {
      this.updateDoughnutChart();
    }
  }

  updateDoughnutChart(): void {
    if (!this.DoughnutChartElement) return;
    const doughnutChart = echarts.init(this.DoughnutChartElement.nativeElement);

    const option = {
      title: {
        text: 'Répartition des Collaborateurs: Admins et Non-Admins',
        left: 'center',
        textStyle: { fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: '5%',
        data: ['Admins', 'Non-Admins'],
        textStyle: { fontSize: 12, fontWeight: 'bold' }
      },
      series: [{
        name: 'Collaborateurs',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        data: [
          { value: this.totalAdmins, name: 'Admins', itemStyle: { color: '#2475bd' } },
          { value: this.totalNotAdmins, name: 'Non-Admins', itemStyle: { color: '#77b4eb' } }
        ],
        label: {
          show: true,
          position: '',
          fontSize: 12,
          fontWeight: 'bold',
          formatter: '{b}: {c} ({d}%)'
        },
        labelLine: {
          show: true
        }
      }]
    };

    doughnutChart.setOption(option);
  }
  // Méthode pour naviguer vers la liste des collaborateurs
  navigateToCollaboratorList(): void {
    this.router.navigate(['/collablist']);
  }

}
