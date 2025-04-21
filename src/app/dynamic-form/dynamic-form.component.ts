import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, NgZone } from '@angular/core';
import { CollaboratorService } from '../services/collaborator.service';
import { DatabaseService } from '../services/database.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as echarts from 'echarts';
import { HeaderComponent } from '../header/header.component';
import { DatabaseComponent } from '../database/database.component';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, DatabaseComponent],
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.css'],
})
export class DynamicFormComponent implements OnInit, AfterViewInit {
  collections: string[] = ['group', 'user', 'collaborator'];
  selectedCollection = '';
  collectionData: any[] = [];
  fieldNames: string[] = [];
  selectedField = '';
  valueForPercentage = '';
  groupedCountResult: { [key: string]: number } = {};
  countResult: number | null = null;
  percentageResult: number | null = null;
  totalCount: number | null = null;
  existingValues: string[] = [];
  errorMessage: string | null = null;
  isLoading: boolean = false;
  databaseName: string = '';
  showChart = false;
  displayMode: 'chart' | 'table' = 'chart';
  visibleColumns: string[] = [];

  @ViewChild('chart') chartElement?: ElementRef;

  private chart: echarts.ECharts | null = null;

  constructor(
    private databaseService: DatabaseService,
    private collaboratorService: CollaboratorService,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.databaseService.selectedDatabase$.subscribe((dbName) => {
      this.databaseName = dbName || '';
      if (!dbName) {
        this.errorMessage = 'Veuillez sélectionner une base de données';
        this.clearForm();
      } else {
        this.errorMessage = null;
        this.clearForm();
      }
    });
  }

  ngAfterViewInit(): void {}

  onCollectionSelect(): void {
    if (!this.selectedCollection || !this.databaseName) {
      this.fieldNames = [];
      this.selectedField = '';
      this.groupedCountResult = {};
      this.totalCount = null;
      this.visibleColumns = [];
      this.errorMessage = !this.databaseName
        ? 'Veuillez sélectionner une base de données'
        : null;
      this.clearChart();
      return;
    }

    this.isLoading = true;
    this.databaseService.getCollectionData(this.databaseName, this.selectedCollection).subscribe(
      (data) => {
        this.collectionData = data;
        this.errorMessage = null;
        this.isLoading = false;
      },
      (error) => {
        console.error('Erreur lors du chargement de la collection', error);
        this.errorMessage = error.status === 404
          ? `Base de données "${this.databaseName}" ou collection "${this.selectedCollection}" non trouvée`
          : `Erreur lors du chargement des données : ${error.error?.message || error.message}`;
        this.collectionData = [];
        this.isLoading = false;
      }
    );

    if (this.selectedCollection === 'collaborator') {
      this.collaboratorService.getCollaboratorFieldNames().subscribe(
        (fields) => {
          this.fieldNames = fields;
          this.errorMessage = null;
          this.isLoading = false;
        },
        (error) => {
          console.error('Erreur lors du chargement des champs', error);
          this.errorMessage = error.status === 404
            ? `Base de données "${this.databaseName}" non trouvée`
            : `Erreur lors du chargement des champs : ${error.error?.message || error.message}`;
          this.fieldNames = [];
          this.isLoading = false;
        }
      );
    } else {
      this.fieldNames = [];
    }

    this.selectedField = '';
    this.groupedCountResult = {};
    this.visibleColumns = [];
    this.clearChart();
  }

  onFieldChange(): void {
    if (this.selectedField && this.selectedCollection === 'collaborator' && this.databaseName) {
      this.isLoading = true;
      this.collaboratorService.countByField(this.selectedField).subscribe(
        (result) => {
          this.groupedCountResult = typeof result === 'string' ? JSON.parse(result) : result;
          this.totalCount = Object.values(this.groupedCountResult).reduce((sum, count) => sum + count, 0);
          this.visibleColumns = Object.keys(this.groupedCountResult);
          this.errorMessage = null;
          this.isLoading = false;
          if (this.displayMode === 'chart') {
            this.updateChart();
          }
        },
        (error) => {
          console.error('Erreur lors du chargement des données du graphique', error);
          this.errorMessage = error.status === 404
            ? `Base de données "${this.databaseName}" non trouvée`
            : `Erreur lors du chargement des données du graphique : ${error.error?.message || error.message}`;
          this.groupedCountResult = {};
          this.totalCount = null;
          this.visibleColumns = [];
          this.isLoading = false;
          this.clearChart();
        }
      );
    } else {
      this.groupedCountResult = {};
      this.totalCount = null;
      this.visibleColumns = [];
      this.errorMessage = !this.databaseName
        ? 'Veuillez sélectionner une base de données'
        : null;
      this.isLoading = false;
      this.clearChart();
    }
  }

  onDisplayModeChange(): void {
    if (this.displayMode === 'chart' && this.groupedCountResult && this.hasData()) {
      this.updateChart();
    } else {
      this.clearChart();
    }
  }

  removeColumn(column: string): void {
    this.visibleColumns = this.visibleColumns.filter(col => col !== column);
  }

  // Nouvelle méthode pour vérifier si groupedCountResult a des données
  hasData(): boolean {
    return this.groupedCountResult && Object.keys(this.groupedCountResult).length > 0;
  }

  private updateChart(): void {
    this.showChart = true;

    setTimeout(() => {
      const labels = Object.keys(this.groupedCountResult);
      const values = Object.values(this.groupedCountResult);
      const nbValues = labels.length;

      if (!this.chart && this.chartElement?.nativeElement) {
        this.chart = echarts.init(this.chartElement.nativeElement);
      }

      if (!this.chart || nbValues === 0 || !this.selectedField) return;

      let option: echarts.EChartsOption;

      if (nbValues === 1) {
        option = {
          title: { text: `Valeur unique: ${labels[0]}`, left: 'center' },
          series: [
            {
              type: 'gauge',
              startAngle: 180,
              endAngle: 0,
              center: ['50%', '75%'],
              radius: '90%',
              min: 0,
              max: values[0] * 2,
              axisLine: {
                lineStyle: {
                  width: 15,
                  color: [[1, '#1890ff']],
                },
              },
              pointer: { show: true },
              title: { show: true, offsetCenter: [0, '-30%'] },
              detail: {
                valueAnimation: true,
                formatter: '{value}',
                fontSize: 20,
                offsetCenter: [0, '-10%'],
              },
              data: [{ value: values[0], name: labels[0] }],
            },
          ],
        };
      } else if (nbValues === 2) {
        option = {
          title: { text: `Répartition par ${this.selectedField}`, left: 'center' },
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          xAxis: { type: 'category', data: labels },
          yAxis: { type: 'value' },
          series: [
            {
              type: 'bar',
              data: values,
              itemStyle: { color: '#1890ff' },
              barWidth: '40%',
              label: { show: true, position: 'top' },
            },
          ],
        };
      } else if (nbValues >= 3 && nbValues <= 5) {
        option = {
          title: { text: `Répartition par ${this.selectedField}`, left: 'center' },
          tooltip: { trigger: 'item' },
          legend: { bottom: 10, left: 'center' },
          series: [
            {
              type: 'pie',
              radius: ['40%', '70%'],
              label: { show: false },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 16,
                  fontWeight: 'bold',
                },
              },
              labelLine: { show: false },
              data: labels.map((label, i) => ({
                value: values[i],
                name: label,
              })),
            },
          ],
        };
      } else if (nbValues > 5) {
        option = {
          title: { text: `Répartition par ${this.selectedField}`, left: 'center' },
          tooltip: {},
          radar: {
            indicator: labels.map((label) => ({
              name: label,
              max: Math.max(...values) + 2,
            })),
          },
          series: [
            {
              name: this.selectedField,
              type: 'radar',
              data: [{ value: values, name: this.selectedField }],
            },
          ],
        };
      } else {
        option = {
          title: { text: 'Aucune donnée à afficher', left: 'center' },
        };
      }

      this.chart.setOption(option, true);
      this.chart.resize();
    }, 0);
  }

  private clearChart(): void {
    this.showChart = false;
    if (this.chart) {
      this.chart.clear();
    }
  }

  private clearForm(): void {
    this.selectedCollection = '';
    this.collectionData = [];
    this.fieldNames = [];
    this.selectedField = '';
    this.groupedCountResult = {};
    this.totalCount = null;
    this.visibleColumns = [];
    this.clearChart();
  }
}
