/* import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CollaboratorService } from '../services/collaborator.service';
import { UserService } from '../services/user.service';
import { GroupService } from '../services/group.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartService } from '../services/chart.service';
import * as echarts from 'echarts';


import { HeaderComponent } from "../header/header.component";
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.css']
})
export class DynamicFormComponent {
  form = { title: '', data: '' };
chartOption: echarts.EChartsOption = {};

@ViewChild('chartContainer') chartContainer: any;

constructor(private chartService: ChartService) {}

onFormSubmit() {
  try {
    const rawData = this.form.data.trim();
    let parsedData: any;

    if (rawData.includes('%')) {
      parsedData = parseFloat(rawData);
    } else if (rawData.startsWith('[')) {
      parsedData = JSON.parse(rawData);
    } else if (rawData.startsWith('{')) {
      parsedData = JSON.parse(rawData);
    } else {
      parsedData = parseFloat(rawData);
    }

    const type = this.chartService.detectChartType(parsedData);
    this.chartOption = this.chartService.getChartOptions(type, parsedData, this.form.title);
  } catch (e) {
    alert('Erreur dans la saisie des données');
    console.error(e);
  }
}

}
 */
