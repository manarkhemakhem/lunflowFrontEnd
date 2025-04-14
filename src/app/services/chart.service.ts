/* import { Injectable } from '@angular/core';
import * as echarts from 'echarts';

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  getChartOptions(type: string, data: any, title: string): echarts.EChartsOption {
    if (type === 'gauge') {
      return {
        title: { text: title },
        series: [{
          type: 'gauge',
          data: [{ value: data, name: title }],
          detail: { formatter: '{value}%' },
          progress: { show: true },
        }]
      };
    } else if (type === 'bar') {
      return {
        title: { text: title },
        xAxis: { type: 'category', data: ['Valeur'] },
        yAxis: {},
        series: [{ type: 'bar', data: [data] }]
      };
    } else if (type === 'line') {
      return {
        title: { text: title },
        xAxis: { type: 'category', data: data.map((_: any, i: number) => `Point ${i + 1}`) },
        yAxis: {},
        series: [{ type: 'line', data }]
      };
    } else if (type === 'pie') {
      return {
        title: { text: title },
        tooltip: { trigger: 'item' },
        legend: { top: '5%', left: 'center' },
        series: [{
          type: 'pie',
          radius: '50%',
          data: Object.entries(data).map(([k, v]) => ({ name: k, value: v }))
        }]
      };
    } else if (type === 'radar') {
      return {
        title: { text: title },
        radar: {
          indicator: [
            { name: 'Min', max: data.max },
            { name: 'Avg', max: data.max },
            { name: 'Max', max: data.max }
          ]
        },
        series: [{
          type: 'radar',
          data: [{ value: [data.min, data.avg, data.max], name: title }]
        }]
      };
    } else {
      return { title: { text: title }, series: [] };
    }
  }

  detectChartType(data: any): string {
    if (typeof data === 'number') return 'gauge';
    else if (Array.isArray(data) && data.length === 1) return 'bar';
    else if (Array.isArray(data)) return 'line';
    else if (data.min !== undefined && data.max !== undefined && data.avg !== undefined) return 'radar';
    else if (typeof data === 'object') return 'pie';
    return 'bar';
  }
}
 */
