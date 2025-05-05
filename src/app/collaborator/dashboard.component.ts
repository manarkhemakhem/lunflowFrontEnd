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


  title: string = 'Titre du PDF';
  content: string = 'Voici le contenu du PDF.';
  filename: string = 'exported.pdf';
  images: File[] = [];
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
  // Fonction pour sélectionner les fichiers
  onImageSelect(event: any) {
    this.images = Array.from(event.target.files);
    console.log('Selected images:', this.images);
  }

  async exportToPDF() {
    this.isExporting = true;

    // Dynamically generate content
    this.content = `
      Statistiques du Tableau de Bord:
      - Total Collaborateurs: ${this.totalCollaborators}
      - Admins: ${this.totalAdmins}
      - Non-Admins: ${this.totalNotAdmins}
      - En Service: ${this.totalNotDeleted}
      - Supprimés: ${this.totalDeleted}
      - En Ligne: ${this.totalOnline}
      - Non En Ligne: ${this.totalNotOnline}
    `;

    // Capture charts as images
    const chartElements = [
      { element: this.DoughnutChartElement, name: 'doughnut_chart.png' },
      { element: this.chartElement, name: 'histogram_chart.png' },
      { element: this.DeletedStatusChartElement, name: 'deleted_status_chart.png' },
      { element: this.onlineChart, name: 'online_chart.png' }
    ];

    this.images = []; // Clear previous images

    for (const chart of chartElements) {
      if (chart.element?.nativeElement) {
        const canvas = await html2canvas(chart.element.nativeElement, {
          scale: 2, // Increase resolution
          useCORS: true // Handle cross-origin issues if any
        });
        const imgData = canvas.toDataURL('image/png');
        const blob = await fetch(imgData).then(res => res.blob());
        this.images.push(new File([blob], chart.name, { type: 'image/png' }));
      }
    }

    // Call the export service
    this.exportService.exportToPDF(this.title, this.content, this.filename, this.images).subscribe({
      next: (response: Blob) => {
        const downloadUrl = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = this.filename;
        link.click();
        this.isExporting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de l\'exportation du PDF', err);
        alert('Une erreur est survenue lors de l\'exportation du PDF. Veuillez réessayer.');
        this.isExporting = false;
        this.cdr.detectChanges();
      }
    });
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
