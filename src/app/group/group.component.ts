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
  @ViewChild('addressChart', { static: false }) addressChartElement!: ElementRef;

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
    }, 500);
  }

  // Méthode pour charger les données des collaborateurs par groupe
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
    const chart = echarts.init(this.addressChartElement.nativeElement);

    // Palette de couleurs bleues
    const blueColors = ['#42A5F5', '#77b4eb', '#87bded', '#2475bd', '#1565C0', '#0D47A1'];

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
        orient: 'vertical',
        left: 'left',
        bottom: '3%',
        data: this.groupsByAddress.map(item => item.address),
        textStyle: {
          fontSize: 12,
          fontWeight: 'bold'
        }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        data:
        this.groupsByAddress.map((item, index) =>
          ({
          value: item.count,
          name: item.address,
          itemStyle: { color: blueColors[index % blueColors.length] }
        })),
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
      }]
    };
    chart.setOption(option);
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
