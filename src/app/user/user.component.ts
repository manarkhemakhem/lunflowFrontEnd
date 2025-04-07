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

  @ViewChild('DoughnutChart', { static: true }) DoughnutChartElement!: ElementRef;
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
    if (!this.DoughnutChartElement) return;  // Vérifie si le DOM est chargé

    const doughnutChart = echarts.init(this.DoughnutChartElement.nativeElement);

    const option = {
      title: {
        text: 'Répartition des Utilisateurs',
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
        data: ['Confirmés', 'Non Confirmés', 'Bloqués', 'Non Bloqués', 'Administrateurs', 'Non Administrateurs'],
        textStyle: { fontSize: 12, fontWeight: 'bold' }
      },
      grid: { top: '10%', bottom: '10%' }, // Ajuster la grille pour s'assurer que tout le contenu est visible
      series: [
        // Donut pour Confirmés et Non Confirmés
        {
          name: 'Confirmés et Non Confirmés',
          type: 'pie',
          radius: ['40%', '70%'],  // Donut (cercle creux)
          center: ['25%', '50%'],  // Centre du graphique 1, éloigné à gauche
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
            { value: this.confirmedCount, name: 'Confirmés', itemStyle: { color: '#DB7D1D' } },
            { value: this.notConfirmedCount, name: 'Non Confirmés', itemStyle: { color: '#38839C' } }  // Deuxième couleur
          ]
        },
        // Donut pour Bloqués et Non Bloqués
        {
          name: 'Bloqués et Non Bloqués',
          type: 'pie',
          radius: ['40%', '70%'],  // Donut (cercle creux)
          center: ['50%', '50%'],  // Centre du graphique 2, centré
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
            { value: this.blockedCount, name: 'Bloqués', itemStyle: { color: '#325561' } },  // Troisième couleur
            { value: this.notBlockedCount, name: 'Non Bloqués', itemStyle: { color: '#42A5F5' } }  // Quatrième couleur
          ]
        },
        // Donut pour Administrateurs et Non Administrateurs
        {
          name: 'Administrateurs et Non Administrateurs',
          type: 'pie',
          radius: ['40%', '70%'],  // Donut (cercle creux)
          center: ['75%', '50%'],  // Centre du graphique 3, éloigné à droite
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
            { value: this.adminCount, name: 'Administrateurs', itemStyle: { color: '#18ABDB' } },  // Cinquième couleur
            { value: this.nonAdminCount, name: 'Non Administrateurs', itemStyle: { color: '#DB7D1D' } }  // Sixième couleur
          ]
        }
      ]
    };

    doughnutChart.setOption(option);  // Applique les options au graphique
  }


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
      series: [{
        name: 'Utilisateurs',
        type: 'bar',
        data: seriesData,
        itemStyle: {
          color: '#42A5F5'
        }
      }]
    };

    chart.setOption(option);
  }
}

