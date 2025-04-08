import { Injectable } from '@angular/core';
import * as echarts from 'echarts';

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  constructor() { }

  // Fonction pour générer un graphique en fonction des données
  generateChart(data: any[], chartType: string, chartElementId: string): void {
    const chart = echarts.init(document.getElementById(chartElementId) as HTMLDivElement);

    let option: any;

    // Déterminer le type de graphique (barres, secteur, ligne, etc.)
    if (chartType === 'bar') {
      option = this.getBarChartOption(data);
    } else if (chartType === 'pie') {
      option = this.getPieChartOption(data);
    } else if (chartType === 'line') {
      option = this.getLineChartOption(data);
    } else if (chartType === 'radar') {
      option = this.getRadarChartOption(data);
    } else {
      option = {};
    }

    // Afficher le graphique avec les options
    chart.setOption(option);
  }

  // Configuration d'un graphique en barres
  private getBarChartOption(data: any[]): any {
    return {
      xAxis: {
        type: 'category',
        data: data.map(item => item.name)
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: data.map(item => item.value),
        type: 'bar'
      }]
    };
  }

  // Configuration d'un graphique en secteur
  private getPieChartOption(data: any[]): any {
    return {
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: data.map(item => ({
          value: item.value,
          name: item.name
        }))
      }]
    };
  }

  // Configuration d'un graphique en ligne
  private getLineChartOption(data: any[]): any {
    return {
      xAxis: {
        type: 'category',
        data: data.map(item => item.name)
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: data.map(item => item.value),
        type: 'line'
      }]
    };
  }

  // Configuration d'un graphique radar
  private getRadarChartOption(data: any[]): any {
    return {
      radar: {
        indicator: data.map(item => ({ name: item.name, max: 100 }))
      },
      series: [{
        type: 'radar',
        data: [{
          value: data.map(item => item.value),
          name: 'Comparaison'
        }]
      }]
    };
  }
}
