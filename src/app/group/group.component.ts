import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  SidenavComponent } from '../Sidenav/Sidenav.component';
import { DatabaseComponent } from '../header/database/database.component';
import { GroupService, Group } from '../services/group.service';
import { CollaboratorService } from '../services/collaborator.service';
import { DatabaseService } from '../services/database.service';
import * as echarts from 'echarts';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import html2canvas from 'html2canvas';
import { ExportService } from '../services/export.service';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, DatabaseComponent, SidenavComponent],
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css']
})
export class GroupComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('collaboratorsChart', { static: false }) chartElement!: ElementRef;
  @ViewChild('addressChart', { static: false }) addressChartElement!: ElementRef;
  @ViewChild('workflowChart', { static: false }) workflowChartElement!: ElementRef;
  @ViewChild('histogramChart', { static: false }) histogramChartElement!: ElementRef;

  groups: Group[] = [];
  totalGroups: number = 0;
  collaboratorsCountByGroup: { groupLabel: string; count: number }[] = [];
  groupsByAddress: { address: string; count: number }[] = [];
  errorMessage: string = '';
  currentDatabase: string = '';
  isExporting = false;
  title: string = 'Rapport Groupes';
  content: string = '';
  filename: string = 'groups_dashboard.pdf';
  images: File[] = [];
  private databaseSubscription!: Subscription;

  constructor(
    private groupService: GroupService,
    private collaboratorService: CollaboratorService,
    private databaseService: DatabaseService,
    private exportService: ExportService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.databaseSubscription = this.databaseService.selectedDatabase$
      .pipe(filter(db => !!db))
      .subscribe(db => {
        console.log(`GroupComponent: Switching to database '${db}'`);
        this.currentDatabase = db;
        this.loadGroupData();
      });
  }

  ngAfterViewInit(): void {
    this.checkAndUpdateCharts();
  }

  ngOnDestroy(): void {
    if (this.databaseSubscription) {
      this.databaseSubscription.unsubscribe();
    }
  }

  async exportToPDF(): Promise<void> {
    this.isExporting = true;

    // Generate dynamic content
    this.content = `
      Statistiques des Groupes:
      - Total Groupes: ${this.totalGroups}
      - Collaborateurs par Groupe:
        ${this.collaboratorsCountByGroup.map(g => `- ${g.groupLabel}: ${g.count}`).join('\n        ')}
      - Groupes par Pays:
        ${this.groupsByAddress.map(a => `- ${a.address}: ${a.count}`).join('\n        ')}
    `;

    // Capture charts as images
    const chartElements = [
      { element: this.chartElement, name: 'collaborators_chart.png' },
      { element: this.addressChartElement, name: 'address_chart.png' },
      { element: this.workflowChartElement, name: 'workflow_chart.png' },
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

  private loadGroupData(): void {
    this.groups = [];
    this.totalGroups = 0;
    this.collaboratorsCountByGroup = [];
    this.groupsByAddress = [];
    this.errorMessage = '';

    console.log(`GroupComponent: Fetching groups for database '${this.currentDatabase}'`);
    this.groupService.getAllGroups().subscribe({
      next: (data) => {
        this.groups = data;
        this.totalGroups = data.length;
        console.log(`GroupComponent: Received ${data.length} groups for database '${this.currentDatabase}'`, data);

        this.loadCollaboratorsData();
        this.loadGroupsByAddress();
        this.checkAndUpdateCharts();
      },
      error: (error) => {
        this.errorMessage = `Erreur lors de la récupération des groupes: ${error.message}`;
        console.error(`GroupComponent: Error fetching groups for database '${this.currentDatabase}'`, error);
      }
    });
  }

  private loadCollaboratorsData(): void {
    this.collaboratorsCountByGroup = this.groups.map(group => ({
      groupLabel: group.label,
      count: group.nbCollabs
    }));
  }

  private loadGroupsByAddress(): void {
    const addressMap = this.groups.reduce((acc, group) => {
      const address = group.address || 'Inconnue';
      acc[address] = (acc[address] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.groupsByAddress = Object.keys(addressMap).map(address => ({
      address,
      count: addressMap[address]
    }));
  }

  private checkAndUpdateCharts(): void {
    if (typeof window === 'undefined' || !this.groups.length) {
      console.log(`GroupComponent: Skipping chart update (no groups or server-side)`);
      return;
    }

    console.log(`GroupComponent: Updating charts for database '${this.currentDatabase}'`);
    this.loadChart();
    this.loadAddressChart();
    this.loadWorkflowChart();
    this.updateGroupBarChart(this.groups);
  }

  private loadChart(): void {
    if (!this.chartElement?.nativeElement) return;

    const chart = echarts.init(this.chartElement.nativeElement);
    const option = {
      title: {
        text: 'Répartition des Collaborateurs par Groupe',
        left: 'center',
        textStyle: { fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'axis' },
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
      yAxis: { type: 'value' },
      series: [{
        data: this.collaboratorsCountByGroup.map(item => item.count),
        type: 'bar',
        color: '#1E3A8A',
        barWidth: '60%',
        barCategoryGap: '20%',
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

  private loadAddressChart(): void {
    if (!this.addressChartElement?.nativeElement) return;

    const chart = echarts.init(this.addressChartElement.nativeElement);
    const blueColors = ['#1E3A8A', '#f13529', '#ecca1f', '#cadeee'];

    const option = {
      title: {
        text: 'Répartition des Groupes par Pays',
        left: 'center',
        textStyle: { fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        top: '80%',
        left: 'center'
      },
      series: [{
        type: 'pie',
        radius: ['35%', '70%'],
        center: ['50%', '50%'],
        startAngle: 180,
        endAngle: 360,
        data: this.groupsByAddress.map((item, index) => ({
          value: item.count,
          name: item.address,
          itemStyle: { color: blueColors[index % blueColors.length] }
        })),
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {c} ({d}%)',
          fontSize: 12,
          fontWeight: 'bold',
          color: '#000'
        }
      }]
    };
    chart.setOption(option);
  }

  private loadWorkflowChart(): void {
    if (!this.workflowChartElement?.nativeElement) return;

    const chart = echarts.init(this.workflowChartElement.nativeElement);
    const labels = this.groups.map(g => g.label);
    const values = this.groups.map(g => g.nbWrkftype);

    const option = {
      title: {
        text: 'Nombre de Workflows par Groupe',
        left: 'center',
        textStyle: { fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { rotate: 30, fontSize: 10 }
      },
      yAxis: { type: 'value' },
      series: [{
        name: 'Workflows',
        type: 'line',
        data: values,
        itemStyle: { color: '#A5D4F5' }
      }]
    };

    chart.setOption(option);
  }

  private updateGroupBarChart(groups: Group[]): void {
    if (!this.histogramChartElement?.nativeElement) return;

    const chart = echarts.init(this.histogramChartElement.nativeElement);
    const groupLabels = groups.map(group => group.label);
    const currentCollabs = groups.map(group => group.nbCollabs);
    const maxCollabs = groups.map(group => group.nbCollabsMax);

    const option = {
      title: {
        text: 'Nombre de Collaborateurs par Groupe',
        left: 'center',
        textStyle: { fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['Collaborateurs Actuels', 'Maximum Autorisé'],
        top: 30
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: groupLabels,
        axisLabel: { fontSize: 12, fontWeight: 'bold' }
      },
      series: [
        {
          name: 'Collaborateurs Actuels',
          type: 'bar',
          stack: 'total',
          data: currentCollabs,
          itemStyle: { color: '#ecca1f' }
        },
        {
          name: 'Maximum Autorisé',
          type: 'bar',
          stack: 'total',
          data: maxCollabs,
          itemStyle: { color: '#93C5FD' }
        }
      ]
    };

    chart.setOption(option);
  }
}
