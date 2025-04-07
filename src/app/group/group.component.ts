import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Collaborator, CollaboratorService } from '../services/collaborator.service';
import { GroupService, Group } from '../services/group.service';
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
  @ViewChild('addressChart', { static: false }) addressChartElement!: ElementRef;
  @ViewChild('workflowChart', { static: true }) workflowChartElement!: ElementRef;
  @ViewChild('histogramChart', { static: false }) histogramChartElement!: ElementRef; // Ajouté


  groups: Group[] = [];
  totalGroups: number = 0;
  collaboratorsCountByGroup: { groupLabel: string, count: number }[] = [];
  groupsByAddress: { address: string, count: number }[] = [];

  errorMessage: string = '';

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
        this.loadGroupsByAddress();
        this.loadworkflowChart();
        this.updateGroupBarChart(this.groups);

      },

      (error) => {
        this.errorMessage = 'Erreur lors de la récupération des groupes';
        console.error('Erreur:', error);
      }
    );
  }
  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      this.loadChart();
      this.loadAddressChart();  // Charger le graphique Doughnut après la vue initialisée
    }
    setTimeout(() => {
      this.loadChart();
      this.loadAddressChart();
      this.updateGroupBarChart(this.groups); // 👈 en backup après DOM totalement prêt

    }, 500);
  }

  loadCollaboratorsData(): void {
    this.collaboratorsCountByGroup = this.groups.map(group => ({
      groupLabel: group.label,
      count: group.nbCollabs
    }));

  }
  loadGroupsByAddress(): void {
    const addressMap = this.groups.reduce((acc, group) => {
      const address = group.address || 'Inconnue';
      if (!acc[address]) {
        acc[address] = 0;
      }
      acc[address]++;
      return acc;
    }, {} as Record<string, number>);

    // Convertir le map en un tableau de {address, count}
    this.groupsByAddress = Object.keys(addressMap).map(address => ({
      address,
      count: addressMap[address]
    }));
  }

  loadAddressChart(): void {
    if (typeof window === 'undefined') return;  // Vérifie que le code est exécuté côté client

    const chart = echarts.init(this.addressChartElement.nativeElement);
    const blueColors = ['#476B9E', '#DBA02E', '#2F76DB', '#867149', '#67696B'];

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
        top: 'bottom',
          left: 'center',

      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        startAngle: 180,
        endAngle: 360,
        data:
        this.groupsByAddress.map((item, index) =>
          ({
          value: item.count,
          name: item.address,
          itemStyle: { color: blueColors[index % blueColors.length] }
        })),


      }]
    };
    chart.setOption(option);
  }

  loadChart(): void {
    if (typeof window === 'undefined') return;  // Vérifie que le code est exécuté côté client

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


  loadworkflowChart(): void {
    if (typeof window === 'undefined' || !this.workflowChartElement) return;

    const chart = echarts.init(this.workflowChartElement.nativeElement);
    const labels = this.groups.map(g => g.label);
    const values = this.groups.map(g => g.nbWrkftype);

    const option = {
      title: {
        text: 'Nombre de workflows par groupe',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          rotate: 30
        }
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        name: 'Workflows',
        type: 'line',  // Utiliser un graphique en ligne
        data: values,
        itemStyle: {
          color: '#42A5F5'
        }
      }]
    };

    chart.setOption(option);
  }
  updateGroupBarChart(groups: Group[]): void {
    if (typeof window === 'undefined' || !this.histogramChartElement) return;

    const chart = echarts.init(this.histogramChartElement.nativeElement);

    const groupLabels = groups.map(group => group.label);
    const currentCollabs = groups.map(group => group.nbCollabs);
    const maxCollabs = groups.map(group => group.nbCollabsMax);

    const option = {
      title: {
        text: 'Nombre de collaborateurs par groupe',
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
      xAxis: {
        type: 'value'
      },
      yAxis: {
        type: 'category',
        data: groupLabels,
        axisLabel: {
          fontSize: 12,
          fontWeight: 'bold'
        }
      },
      series: [
        {
          name: 'Collaborateurs Actuels',
          type: 'bar',
          stack: 'total',
          data: currentCollabs,
          itemStyle: { color: '#38839C' }
        },
        {
          name: 'Maximum Autorisé',
          type: 'bar',
          stack: 'total',
          data: maxCollabs,
          itemStyle: { color: '#18ABDB' }
        }
      ]
    };

    chart.setOption(option);
  }

}
