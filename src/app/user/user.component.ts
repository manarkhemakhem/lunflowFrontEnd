import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  SidenavComponent } from '../Sidenav/Sidenav.component';
import { DatabaseComponent } from '../header/database/database.component';
import { UserService, User } from '../services/user.service';
import { DatabaseService } from '../services/database.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as echarts from 'echarts';
import { ExportService } from '../services/export.service';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, DatabaseComponent, SidenavComponent],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, AfterViewInit, OnDestroy {
  showCharts = true;
  isSidebarOpen = false;
  isExporting = false;
  title: string = 'Rapport Utilisateurs';
  content: string = '';
  filename: string = 'users_dashboard.pdf';
  images: File[] = [];

  @ViewChild('DoughnutChart1') doughnutChart1Element?: ElementRef;
  @ViewChild('DoughnutChart2') doughnutChart2Element?: ElementRef;
  @ViewChild('DoughnutChart3') doughnutChart3Element?: ElementRef;
  @ViewChild('HistogramChart') histogramChartElement?: ElementRef;

  users: User[] = [];
  totalUsers: number = 0;
  confirmedCount: number = 0;
  notConfirmedCount: number = 0;
  blockedCount: number = 0;
  notBlockedCount: number = 0;
  adminCount: number = 0;
  nonAdminCount: number = 0;
  dateCreation: Date[] = [];
  groupedData: { [key: string]: number } = {};
  errorMessage: string = '';
  currentDatabase: string = '';
  private databaseSubscription?: Subscription;

  constructor(
    private userService: UserService,
    private databaseService: DatabaseService,
    private exportService: ExportService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (typeof window === 'undefined') return;

    this.databaseSubscription = this.databaseService.selectedDatabase$
      .pipe(filter(db => !!db))
      .subscribe(db => {
        console.log(`UserComponent: Switching to database '${db}'`);
        this.currentDatabase = db;
        this.loadAllData();
      });
  }

  ngAfterViewInit(): void {
    this.updateDoughnutChart();
    this.updateHistogramChart();
  }

  ngOnDestroy(): void {
    if (this.databaseSubscription) {
      this.databaseSubscription.unsubscribe();
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  async exportToPDF(): Promise<void> {
    this.isExporting = true;

    // Generate dynamic content
    this.content = `
      Statistiques des Utilisateurs:
      - Total Utilisateurs: ${this.totalUsers}
      - Confirmés: ${this.confirmedCount}
      - Non Confirmés: ${this.notConfirmedCount}
      - Bloqués: ${this.blockedCount}
      - Non Bloqués: ${this.notBlockedCount}
      - Admins: ${this.adminCount}
      - Non Admins: ${this.nonAdminCount}
    `;

    // Capture charts as images
    const chartElements = [
      { element: this.doughnutChart1Element, name: 'confirmed_chart.png' },
      { element: this.doughnutChart2Element, name: 'blocked_chart.png' },
      { element: this.doughnutChart3Element, name: 'admin_chart.png' },
      { element: this.histogramChartElement, name: 'histogram_chart.png' }
    ];

    this.images = [];

    for (const chart of chartElements) {
      if (chart.element?.nativeElement) {
        const canvas = await html2canvas(chart.element.nativeElement, {
          scale: 2,
          useCORS: true
        });
        const imgData = canvas.toDataURL('image/png');
        const blob = await fetch(imgData).then(res => res.blob());
        this.images.push(new File([blob], chart.name, { type: 'image/png' }));
      }
    }

    // Call export service
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
        this.errorMessage = 'Une erreur est survenue lors de l\'exportation du PDF';
        this.isExporting = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadAllData(): void {
    this.users = [];
    this.totalUsers = 0;
    this.confirmedCount = 0;
    this.notConfirmedCount = 0;
    this.blockedCount = 0;
    this.notBlockedCount = 0;
    this.adminCount = 0;
    this.nonAdminCount = 0;
    this.dateCreation = [];
    this.groupedData = {};
    this.errorMessage = '';

    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.totalUsers = data.length;
        console.log(`UserComponent: Fetched ${data.length} users for database '${this.currentDatabase}'`);
      },
      error: (error) => {
        this.errorMessage = `Erreur lors de la récupération des utilisateurs: ${error.message}`;
        console.error(`UserComponent: Error fetching users for database '${this.currentDatabase}'`, error);
      }
    });

    this.userService.getConfirmedUsers().subscribe({
      next: (users) => {
        this.confirmedCount = users.length;
        this.updateDoughnutChart();
      },
      error: (error) => {
        console.error(`UserComponent: Error fetching confirmed users`, error);
      }
    });

    this.userService.getNotConfirmedUsers().subscribe({
      next: (users) => {
        this.notConfirmedCount = users.length;
        this.updateDoughnutChart();
      },
      error: (error) => {
        console.error(`UserComponent: Error fetching not confirmed users`, error);
      }
    });

    this.userService.getDateCreation().subscribe({
      next: (dates) => {
        this.dateCreation = dates.filter(date => this.isValidDate(date));
        console.log(`UserComponent: Fetched ${this.dateCreation.length} creation dates`, this.dateCreation);
        this.groupDataByQuarter();
        console.log(`UserComponent: Grouped data by quarter`, this.groupedData);
        this.updateHistogramChart();
      },
      error: (error) => {
        console.error(`UserComponent: Error fetching creation dates`, error);
      }
    });

    this.userService.getBlockedUsers().subscribe({
      next: (users) => {
        this.blockedCount = users.length;
        this.updateDoughnutChart();
      },
      error: (error) => {
        console.error(`UserComponent: Error fetching blocked users`, error);
      }
    });

    this.userService.getNotBlockedUsers().subscribe({
      next: (users) => {
        this.notBlockedCount = users.length;
        this.updateDoughnutChart();
      },
      error: (error) => {
        console.error(`UserComponent: Error fetching not blocked users`, error);
      }
    });

    this.userService.getAdminUsers().subscribe({
      next: (users) => {
        this.adminCount = users.length;
        this.updateDoughnutChart();
      },
      error: (error) => {
        console.error(`UserComponent: Error fetching admin users`, error);
      }
    });

    this.userService.getNonAdminUsers().subscribe({
      next: (users) => {
        this.nonAdminCount = users.length;
        this.updateDoughnutChart();
      },
      error: (error) => {
        console.error(`UserComponent: Error fetching non-admin users`, error);
      }
    });
  }

  isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime()) && date.getTime() > 0;
  }

  updateDoughnutChart(): void {
    if (typeof window === 'undefined' || !this.doughnutChart1Element || !this.doughnutChart2Element || !this.doughnutChart3Element) return;

    const doughnutChart1 = echarts.init(this.doughnutChart1Element.nativeElement);
    const doughnutChart2 = echarts.init(this.doughnutChart2Element.nativeElement);
    const doughnutChart3 = echarts.init(this.doughnutChart3Element.nativeElement);

    const option1 = {
      title: {
        text: 'Utilisateurs Confirmés vs Non Confirmés',
        left: 'center',
        top: 10,
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left', top: 'middle' },
      series: [
        {
          name: 'Confirmés et Non Confirmés',
          type: 'pie',
          radius: ['25%', '50%'],
          center: ['60%', '60%'],
          itemStyle: { borderRadius: 5 },
          label: {
            show: true,
            position: 'inside',
            formatter: '{b}\n{c} ({d}%)',
            fontSize: 12,
            fontWeight: 'bold'
          },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
          data: [
            { value: this.confirmedCount, name: 'Confirmés', itemStyle: { color: '#f13529' } },
            { value: this.notConfirmedCount, name: 'Non Confirmés', itemStyle: { color: '#93C5FD' } }
          ]
        }
      ]
    };

    const option2 = {
      title: {
        text: 'Utilisateurs Bloqués vs Non Bloqués',
        left: 'center',
        top: 10,
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left', top: 'middle' },
      series: [
        {
          name: 'Bloqués et Non Bloqués',
          type: 'pie',
          radius: '50%',
          center: ['60%', '60%'],
          itemStyle: { borderRadius: 5 },
          label: { show: true, formatter: '{b}: {d}%', position: 'outside' },
          emphasis: { label: { show: true, fontWeight: 'bold' } },
          data: [
            { value: this.blockedCount, name: 'Bloqués', itemStyle: { color: '#f13529' } },
            { value: this.notBlockedCount, name: 'Non Bloqués', itemStyle: { color: '#93C5FD' } }
          ]
        }
      ]
    };

    const option3 = {
      title: {
        text: 'Répartition des Admins',
        left: 'center',
        top: 10,
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '10%', right: '10%', bottom: '15%', containLabel: true },
      xAxis: { type: 'value', boundaryGap: [0, 0.01] },
      yAxis: { type: 'category', data: ['Non Admins', 'Admins'] },
      series: [
        {
          name: 'Nombre',
          type: 'bar',
          data: [this.nonAdminCount, this.adminCount],
          itemStyle: { color: (params: any) => (params.dataIndex === 1 ? '#1E3A8A' : '#ecca1f') },
          label: { show: true, position: 'right' }
        }
      ]
    };

    doughnutChart1.setOption(option1);
    doughnutChart2.setOption(option2);
    doughnutChart3.setOption(option3);
  }

  groupDataByQuarter(): void {
    this.groupedData = {};
    this.dateCreation.forEach(date => {
      const year = date.getFullYear();
      const quarter = Math.floor((date.getMonth() + 3) / 3);
      const key = `${year}-T${quarter}`;
      this.groupedData[key] = (this.groupedData[key] || 0) + 1;
    });
  }

  updateHistogramChart(): void {
    if (typeof window === 'undefined' || !this.histogramChartElement) return;

    const chart = echarts.init(this.histogramChartElement.nativeElement);
    const xAxisData = Object.keys(this.groupedData);
    const seriesData = Object.values(this.groupedData);

    const option = {
      title: {
        text: "Nombre d'utilisateurs par trimestre",
        left: 'center',
        textStyle: { fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: { rotate: 45, interval: 0 }
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Utilisateurs',
          type: 'bar',
          data: seriesData,
          itemStyle: { color: '#1E3A8A' },
          label: {
            show: true,
            position: 'inside',
            fontSize: 12,
            fontWeight: 'bold',
            color: '#fff'
          }
        }
      ]
    };

    chart.setOption(option);
  }
}
