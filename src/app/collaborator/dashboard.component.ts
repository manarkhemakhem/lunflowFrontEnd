import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Collaborator, CollaboratorService } from '../collaborator.service';
import { RouterModule } from '@angular/router';
import * as echarts from 'echarts';
import { HeaderComponent } from "../header/header.component";

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
  creationHistogram: { [date: string]: number } = {};
  totalCollaborators: number = 0;
  totalAdmins: number = 0;
  totalNotAdmins: number = 0;
  collaborators: Collaborator[] = [];
  admins: Collaborator[] = [];
  notAdmins: Collaborator[] = [];

  constructor(private collaboratorService: CollaboratorService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    if (typeof window !== 'undefined')
    {this.loadDashboardData();};

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
          text: 'Histogramme des Créations de Collaborateurs',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: dates
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: 'Nombre de collaborateurs',
            type: 'bar',
            data: values,
            color: '#42A5F5'
          }
        ]
      };

      chartInstance.setOption(options);
    }

  loadDashboardData(): void {
    this.collaboratorService.getAllCollaborators().subscribe(data => {
      this.collaborators = data;
      this.totalCollaborators = this.collaborators.length;
      this.checkAndUpdateCharts();
    });

    this.collaboratorService.getAllAdmin().subscribe(data => {
      this.admins = data;
      this.totalAdmins = this.admins.length;
      this.checkAndUpdateCharts();
    });

    this.collaboratorService.getAllNotAdmin().subscribe(data => {
      this.notAdmins = data;
      this.totalNotAdmins = this.notAdmins.length;
      this.checkAndUpdateCharts();
    });
  }



  checkAndUpdateCharts(): void {
    if (this.totalCollaborators > 0) {
      this.updateDoughnutChart(); // Calling the new method
    }
  }

  updateDoughnutChart(): void {
    if (!this.DoughnutChartElement) return;
    const doughnutChart = echarts.init(this.DoughnutChartElement.nativeElement);

    const option = {
      title: {
        text: ' Admins et Non-Admins',
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


}
