import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import * as echarts from 'echarts';
import { filter, forkJoin } from 'rxjs';
import { DatabaseComponent } from "../header/database/database.component";
import { Collaborator, CollaboratorService } from '../services/collaborator.service';
import { DatabaseService } from '../services/database.service';
import {  SidenavComponent } from '../Sidenav/Sidenav.component';
import { ExportService } from '../services/export.service';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatabaseComponent, SidenavComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {


  isSidebarOpen = false;

  onSidebarToggled(isOpen: boolean) {
    this.isSidebarOpen = isOpen;
  }


  @ViewChild('DoughnutChart', { static: true }) DoughnutChartElement!: ElementRef;
  @ViewChild('histogramChart', { static: false }) chartElement!: ElementRef;
  @ViewChild('DeletedStatusChartElement', { static: false }) DeletedStatusChartElement!: ElementRef;
  @ViewChild('onlineChart', { static: false }) onlineChart!: ElementRef;

  creationHistogram: { [date: string]: number } = {};
  totalCollaborators: number = 0;
  totalAdmins: number = 0;
  totalNotAdmins: number = 0;
  collaborators: Collaborator[] = [];
  totalDeleted: number = 0;
  totalNotDeleted: number = 0;
  totalOnline: number = 0;
  totalNotOnline: number = 0;
  isExporting = false;
  constructor(
    private collaboratorService: CollaboratorService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private databaseService: DatabaseService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.databaseService.selectedDatabase$
      .pipe(
        filter(db => !!db) // Ignore empty database names
      )
      .subscribe(db => {
        console.log('Loading dashboard data for database:', db);
        this.loadDashboardData(db);
      });
  }

  ngAfterViewInit(): void {
    this.checkAndUpdateCharts();
  }
  @ViewChild('dashboardToCapture', { static: false }) dashboardRef!: ElementRef;
  exportToPDF(): void {
    this.isExporting = true;

    // Récupérer chaque graphique ECharts
    const doughnutChart = echarts.getInstanceByDom(this.DoughnutChartElement.nativeElement);
    const histogramChart = echarts.getInstanceByDom(this.chartElement.nativeElement);
    const deletedChart = echarts.getInstanceByDom(this.DeletedStatusChartElement.nativeElement);
    const onlineChart = echarts.getInstanceByDom(this.onlineChart.nativeElement);

    // Exporter chaque graphique en image PNG
    const doughnutBase64 = doughnutChart?.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' }) || '';
    const histogramBase64 = histogramChart?.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' }) || '';
    const deletedBase64 = deletedChart?.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' }) || '';
    const onlineBase64 = onlineChart?.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' }) || '';

    // Créer une nouvelle instance jsPDF
    const doc = new jsPDF();
    doc.setFontSize(16);

    // Titre du PDF
    doc.text('Rapport du Dashboard', 20, 20);

    // Statistiques
    doc.setFontSize(12);
    doc.text(`Total Collaborateurs : ${this.totalCollaborators}`, 20, 30);
    doc.text(`Total Non Supprimés : ${this.totalNotDeleted}`, 20, 40);
    doc.text(`Total Non Administrateurs : ${this.totalNotAdmins}`, 20, 50);
    doc.text(`Total En Ligne : ${this.totalOnline}`, 20, 60);

    // Ajouter les graphiques
    doc.text('Graphiques :', 20, 70);

    // Ajouter chaque graphique au PDF sous forme d'image (pas base64)
    // Ajouter le graphique doughnut
    if (doughnutBase64) {
      const doughnutImage = new Image();
      doughnutImage.src = doughnutBase64;
      doughnutImage.onload = () => {
        doc.text('Répartition des Collaborateurs', 20, 80);
        doc.addImage(doughnutImage, 'PNG', 20, 90, 180, 100);  // Ajouter l'image du graphique doughnut

        // Ajouter le graphique histogramme
        if (histogramBase64) {
          const histogramImage = new Image();
          histogramImage.src = histogramBase64;
          histogramImage.onload = () => {
            doc.text('Répartition par Histogramme', 20, 200);
            doc.addImage(histogramImage, 'PNG', 20, 210, 180, 100);  // Ajouter l'image du graphique histogramme

            // Ajouter le graphique supprimé
            if (deletedBase64) {
              const deletedImage = new Image();
              deletedImage.src = deletedBase64;
              deletedImage.onload = () => {
                doc.text('Statut Supprimé', 20, 320);
                doc.addImage(deletedImage, 'PNG', 20, 330, 180, 100);  // Ajouter l'image du graphique supprimé

                // Ajouter le graphique en ligne
                if (onlineBase64) {
                  const onlineImage = new Image();
                  onlineImage.src = onlineBase64;
                  onlineImage.onload = () => {
                    doc.text('Statut En Ligne', 20, 440);
                    doc.addImage(onlineImage, 'PNG', 20, 450, 180, 100);  // Ajouter l'image du graphique en ligne

                    // Finaliser l'exportation du PDF
                    doc.save('dashboard.pdf');
                    this.isExporting = false;
                  };
                } else {
                  console.error('Image du graphique en ligne manquante');
                  this.isExporting = false;
                }
              };
            } else {
              console.error('Image du graphique supprimé manquante');
              this.isExporting = false;
            }
          };
        } else {
          console.error('Image du graphique histogramme manquante');
          this.isExporting = false;
        }
      };
    } else {
      console.error('Image du graphique doughnut manquante');
      this.isExporting = false;
    }
  }
  private loadDashboardData(databaseName: string): void {
    forkJoin({
      collaborators: this.collaboratorService.getAllCollaborators(),
      admins: this.collaboratorService.getAllAdmin(),
      notAdmins: this.collaboratorService.getAllNotAdmin(),
      online: this.collaboratorService.getCollaboratorsOnline(),
      offline: this.collaboratorService.getCollaboratorsOffline(),
      histogram: this.collaboratorService.getCreationDatesHistogram()
    }).subscribe({
      next: ({ collaborators, admins, notAdmins, online, offline, histogram }) => {
        // Update collaborator data
        this.collaborators = collaborators;
        this.totalCollaborators = collaborators.length;
        this.totalAdmins = admins.length;
        this.totalNotAdmins = notAdmins.length;
        this.totalOnline = online.length;
        this.totalNotOnline = offline.length;
        this.totalDeleted = collaborators.filter(collab => collab.deleted === true).length;
        this.totalNotDeleted = collaborators.filter(collab => collab.deleted === false).length;
        this.creationHistogram = histogram;

        // Update charts
        this.updateDoughnutChart();
        this.updateDeletedStatusChart();
        this.updateOnlineStatusChart();
        this.loadChart();

        this.cdr.detectChanges(); // Trigger change detection
      },
      error: err => {
        console.error('Erreur de chargement des données du tableau de bord:', err);
      }
    });
  }





  private loadChart(): void {
    if (typeof window === 'undefined' || !this.chartElement?.nativeElement) return;

    console.log('Histogram data:', this.creationHistogram);

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
        data: dates,
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
          color: '#93C5FD', // Bleu moyen
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

  private updateDeletedStatusChart(): void {
    if (typeof window === 'undefined' || !this.DeletedStatusChartElement?.nativeElement) return;

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
        top: '20%'
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
          { value: this.totalDeleted, name: 'Supprimés', itemStyle: { color: '#ecca1f' } }, // Jaune moutarde
          { value: this.totalNotDeleted, name: 'Non Supprimés', itemStyle: { color: '#93C5FD' } } // Bleu clair
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

  private updateOnlineStatusChart(): void {
    if (typeof window === 'undefined' || !this.onlineChart?.nativeElement) return;

    const chart = echarts.init(this.onlineChart.nativeElement);

    const option = {
      title: {
        text: 'État des Collaborateurs',
        left: 'center',
        textStyle: { fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
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
          radius: ['30%', '60%'],
          center: ['50%', '50%'],
          data: [
            { value: this.totalOnline, name: 'En ligne', itemStyle: { color: '#f13529' } }, // Rose pâle
            { value: this.totalNotOnline, name: 'Non En ligne', itemStyle: { color: '#3B82F6' } } // Bleu clair
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
  private updateDoughnutChart(): void {
    if (typeof window === 'undefined' || !this.DoughnutChartElement?.nativeElement) return;

    const doughnutChart = echarts.init(this.DoughnutChartElement.nativeElement);

    const option = {
      title: {
        text: 'Répartition des Collaborateurs: Admins et Non-Admins',
        left: 'center',
        textStyle: { fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      legend: {
        left: 'center',
        top: 'bottom',
        data: ['Admins', 'Non-Admins'],
        textStyle: { fontSize: 12, fontWeight: 'bold' }
      },
      toolbox: {
        show: true
      },
      series: [{
        name: 'Collaborateurs',
        type: 'pie',
        radius: [16, 120],
        center: ['50%', '50%'],
        roseType: 'radius',
        itemStyle: {
          borderRadius: 5
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true
          }
        },
        data: [
          { value: this.totalAdmins, name: 'Admins', itemStyle: { color: '#f13529' } }, // rouge
          { value: this.totalNotAdmins, name: 'Non-Admins', itemStyle: { color: '#3B82F6' } } // Bleu moyen
        ],
      }]
    };

    doughnutChart.setOption(option);
  }

  private checkAndUpdateCharts(): void {
    if (this.totalCollaborators > 0) {
      this.updateDoughnutChart();
      this.updateDeletedStatusChart();
      this.updateOnlineStatusChart();
    }
    if (Object.keys(this.creationHistogram).length > 0) {
      this.loadChart();
    }
  }

  navigateToCollaboratorList(): void {
    this.router.navigate(['/collablist']);
  }
}
