import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { UserService, User } from '../services/user.service';
import { HeaderComponent } from "../header/header.component";
import { CommonModule } from '@angular/common';
import * as echarts from 'echarts';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

  @ViewChild('DoughnutChart1', { static: true }) DoughnutChart1Element!: ElementRef;
  @ViewChild('DoughnutChart2', { static: true }) DoughnutChart2Element!: ElementRef;
  @ViewChild('DoughnutChart3', { static: true }) DoughnutChart3Element!: ElementRef;

  @ViewChild('HistogramChart', { static: true }) histogramChartElement!: ElementRef;

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
  constructor(private userService: UserService) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      // Récupère tous les utilisateurs
      this.userService.getAllUsers().subscribe(data => {
        this.users = data;
        this.totalUsers = data.length;
      });

      // Récupère les confirmés
      this.userService.getConfirmedUsers().subscribe(users => {
        this.confirmedCount = users.length;
        this.updateDoughnutChart();
      });

      // Récupère les non confirmés
      this.userService.getNotConfirmedUsers().subscribe(users => {
        this.notConfirmedCount = users.length;
        this.updateDoughnutChart();
      });
      this.userService.getDateCreation().subscribe(dates => {
        this.dateCreation = dates.filter(date => this.isValidDate(date));  // Exclure les dates invalides
        console.log("Dates de création des utilisateurs:", this.dateCreation);  // Log des dates
        this.groupDataByQuarter();
        console.log("Données regroupées par trimestre:", this.groupedData);  // Log des données groupées
        this.updateHistogramChart();
      });

        this.userService.getBlockedUsers().subscribe(users => {
          this.blockedCount = users.length;
          this.updateDoughnutChart();
        });

        // Récupérer les utilisateurs non bloqués
        this.userService.getNotBlockedUsers().subscribe(users => {
          this.notBlockedCount = users.length;
          this.updateDoughnutChart();
        });

        // Récupérer les administrateurs
        this.userService.getAdminUsers().subscribe(users => {
          this.adminCount = users.length;
          this.updateDoughnutChart();
        });

        // Récupérer les non administrateurs
        this.userService.getNonAdminUsers().subscribe(users => {
          this.nonAdminCount = users.length;
          this.updateDoughnutChart();
        });
      }
    }

  isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime()) && date.getTime() > 0;
  }
  updateDoughnutChart(): void {
    if (typeof window === 'undefined') return;
    if (!this.DoughnutChart1Element.nativeElement) return;  // Vérifie si le DOM est chargé
    const doughnutChart1 = echarts.init(this.DoughnutChart1Element.nativeElement);
    const doughnutChart2 = echarts.init(this.DoughnutChart2Element.nativeElement);
    const doughnutChart3 = echarts.init(this.DoughnutChart3Element.nativeElement);


    const option = {
      title: {
        text: 'Utilisateurs Confirmés vs Non Confirmés',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle'
      },
      series: [
        {
          name: 'Confirmés et Non Confirmés',
          type: 'pie',
          radius: ['25%', '50%'],
          center: ['60%', '60%'],
          itemStyle: {
            borderRadius: 5
          },
          label: {
            show: true,
            position: 'inside',
            formatter: '{b}\n{c} ({d}%)',
            fontSize: 12,
            fontWeight: 'bold'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          data: [
            { value: this.confirmedCount, name: 'Confirmés', itemStyle: { color: '#A5D4F5' } },
            { value: this.notConfirmedCount, name: 'Non Confirmés', itemStyle: { color: '#cadeee' } }
          ]
        }
      ]
    };

    const option2 = {
      title: {
        text: 'Utilisateurs Bloqués vs Non Bloqués',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle'
      },
      series: [
        {
          name: 'Bloqués et Non Bloqués',
          type: 'pie',
          radius: '50%',
          center: ['60%', '60%'],
          itemStyle: {
            borderRadius: 5
          },
          label: {
            show: true,
            formatter: '{b}: {d}%',
            position: 'outside'
          },
          emphasis: {
            label: {
              show: true,
              fontWeight: 'bold'
            }
          },
          data: [
            { value: this.blockedCount, name: 'Bloqués', itemStyle: { color: '#3a90d1' } },
            { value: this.notBlockedCount, name: 'Non Bloqués', itemStyle: { color: '#cadeee' } }
          ]
        }
      ]
    };


    const option3 = {
      title: {
        text: 'Répartition des Admins',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },

      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        boundaryGap: [0, 0.01]
      },
      yAxis: {
        type: 'category',
        data: ['Non Admins', 'Admins']
      },
      series: [{
        name: 'Nombre',
        type: 'bar',
        data: [this.nonAdminCount, this.adminCount],
        itemStyle: {
          color: (params: any) => {
            return params.name === 'Admins' ? '#A5D4F5' : '#3a90d1';
          }
        },
        label: {
          show: true,
          position: 'right'
        }
      }]
    };


    // Applique les options aux graphiques
    doughnutChart1.setOption(option);
    doughnutChart2.setOption(option2);
    doughnutChart3.setOption(option3);
  };


   groupDataByQuarter() {
    this.groupedData = {};

    this.dateCreation.forEach(date => {
      const year = date.getFullYear();
      const quarter = Math.floor((date.getMonth() + 3) / 3);

      const key = `${year}-T${quarter}`;

      if (this.groupedData[key]) {
        this.groupedData[key]++;
      } else {
        this.groupedData[key] = 1;
      }
    });
  }

  updateHistogramChart(): void {
    if (typeof window === 'undefined') return;
    if (!this.histogramChartElement) return;

    const chart = echarts.init(this.histogramChartElement.nativeElement);

    // Préparation des données pour l'histogramme
    const xAxisData = Object.keys(this.groupedData);
    const seriesData = Object.values(this.groupedData);

    const option = {
      title: {
        text: 'Nombre d\'utilisateurs par trimestre',
        left: 'center',
        textStyle: { fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: {
          rotate: 45,
          interval: 0
        }
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: 'Utilisateurs',
          type: 'bar',
          data: seriesData,
          itemStyle: {
            color: '#3a90d1'
          },
          label: {
            show: true, // Affiche les labels
            position: 'inside', // Positionne le label à l'intérieur des barres
            fontSize: 12, // Taille du texte
            fontWeight: 'bold', // Style du texte
            color: '#fff' // Couleur du texte
          }
        }
      ]
    };

    chart.setOption(option);
  }}

