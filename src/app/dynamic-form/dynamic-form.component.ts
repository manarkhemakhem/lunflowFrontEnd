import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, NgZone, Inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as echarts from 'echarts';
import { isPlatformBrowser } from '@angular/common';
import {SidenavComponent } from "../Sidenav/Sidenav.component";
import { DatabaseComponent } from "../header/database/database.component";

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, FormsModule,DatabaseComponent, SidenavComponent],
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.css'],
})
export class DynamicFormComponent implements OnInit, AfterViewInit, OnDestroy {
  collections: string[] = ['group', 'user', 'collaborator'];
  selectedCollection = '';
  collectionData: any[] = [];
  fieldNames: string[] = [];
  selectedField = '';
  filterOperator = 'equals';
  filterValue = '';
  dateInputMode: 'date' | 'year' = 'date'; // Fixed initialization
  groupedCountResult: { [key: string]: number } = {};
  totalCount: number | null = null;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  databaseName: string = '';
  showChart: boolean = false;
  displayMode: 'chart' | 'table' = 'chart';
  visibleColumns: string[] = [];

  // Updated operatorOptions with both date and date_year
  public operatorOptions: { [key: string]: string[] } = {
    string: ['equals', 'notequals', 'contains', 'notcontains', 'startswith', 'endswith'],
    boolean: ['equals', 'notequals'],
    integer: ['equals', 'notequals'],
    date: ['equals', 'greaterthan', 'lessthan'],
    date_year: ['equalsyear', 'greaterthan', 'lessthan'],
  };

  @ViewChild('chart') chartElement?: ElementRef;
  private chart: echarts.ECharts | null = null;

  constructor(
    private databaseService: DatabaseService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit: Component initialized');
    this.databaseService.selectedDatabase$.subscribe((dbName) => {
      this.databaseName = dbName || '';
      console.log('Database selected:', dbName);
      if (!dbName) {
        this.errorMessage = 'Veuillez sélectionner une base de données';
        this.clearForm();
      } else {
        this.errorMessage = null;
        this.clearForm();
      }
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && this.chartElement?.nativeElement) {
      try {
        console.log('ngAfterViewInit: Initializing ECharts');
        this.zone.runOutsideAngular(() => {
          this.chart = echarts.init(this.chartElement!.nativeElement);
          window.addEventListener('resize', this.resizeChart);
        });
      } catch (error) {
        console.error('ngAfterViewInit: ECharts initialization failed:', error);
      }
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.chart) {
        this.chart.dispose();
        window.removeEventListener('resize', this.resizeChart);
      }
    }
  }

  private resizeChart = (): void => {
    if (isPlatformBrowser(this.platformId) && this.chart) {
      this.chart.resize();
    }
  };

  onCollectionSelect(): void {
    console.log('onCollectionSelect: Selected collection:', this.selectedCollection);
    console.log('onCollectionSelect: State:', { selectedField: this.selectedField, filterValue: this.filterValue, filterOperator: this.filterOperator, isLoading: this.isLoading });
    if (!this.selectedCollection || !this.databaseName) {
      this.fieldNames = [];
      this.selectedField = '';
      this.filterOperator = 'equals';
      this.filterValue = '';
      this.groupedCountResult = {};
      this.totalCount = null;
      this.visibleColumns = [];
      this.errorMessage = !this.databaseName ? 'Veuillez sélectionner une base de données' : null;
      this.isLoading = false;
      this.clearChart();
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    this.databaseService.getCollectionData(this.databaseName, this.selectedCollection).subscribe({
      next: (data: any[]) => {
        console.log('onCollectionSelect: getCollectionData response:', data);
        this.collectionData = data;
        this.loadFieldNames();
        this.errorMessage = null;
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('onCollectionSelect: fieldNames:', this.fieldNames);
      },
      error: (error: any) => {
        console.error('onCollectionSelect: getCollectionData error:', error);
        this.errorMessage = error.status === 404
          ? `Base de données "${this.databaseName}" ou collection "${this.selectedCollection}" non trouvée`
          : `Erreur lors du chargement des données : ${error.message || error}`;
        this.collectionData = [];
        this.fieldNames = [];
        this.selectedField = '';
        this.filterValue = '';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadFieldNames(): void {
    if (this.selectedCollection) {
      this.databaseService.getFieldNames(this.selectedCollection).subscribe({
        next: (fields: string[]) => {
          console.log('loadFieldNames: Field names for', this.selectedCollection, ':', fields);
          this.fieldNames = fields;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('loadFieldNames: Error fetching fields for', this.selectedCollection, ':', error);
          this.fieldNames = this.extractFieldNames(this.collectionData);
          console.log('loadFieldNames: Fallback to extracted field names:', this.fieldNames);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      this.fieldNames = this.extractFieldNames(this.collectionData);
      console.log('loadFieldNames: Extracted field names:', this.fieldNames);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  onFieldChange(): void {
    console.log('onFieldChange: selectedField:', this.selectedField, 'filterValue:', this.filterValue, 'filterOperator:', this.filterOperator, 'isLoading:', this.isLoading);
    const previousFieldType = this.inferFieldType(this.previousField || '');
    const currentFieldType = this.inferFieldType(this.selectedField);
    console.log('onFieldChange: previousFieldType:', previousFieldType, 'currentFieldType:', currentFieldType);
    if (this.selectedField && !this.operatorOptions[this.getOperatorKey(currentFieldType)]?.includes(this.filterOperator)) {
      this.filterOperator = this.operatorOptions[this.getOperatorKey(currentFieldType)][0] || 'equals';
      console.log('onFieldChange: Reset filterOperator to:', this.filterOperator);
    }
    this.filterValue = '';
    this.dateInputMode = 'date';
    this.previousField = this.selectedField;
    this.cdr.detectChanges();

    if (this.selectedField && this.selectedCollection && this.databaseName) {
      this.isLoading = true;
      this.cdr.detectChanges();
      this.databaseService.getCollectionData(this.databaseName, this.selectedCollection).subscribe({
        next: (data: any[]) => {
          console.log('onFieldChange: getCollectionData response:', data);
          this.collectionData = data;
          this.groupedCountResult = this.countByField(data, this.selectedField);
          this.totalCount = Object.values(this.groupedCountResult).reduce((sum, count) => sum + count, 0);
          this.visibleColumns = Object.keys(this.groupedCountResult);
          this.errorMessage = null;
          this.isLoading = false;
          this.cdr.detectChanges();
          console.log('onFieldChange: State:', { selectedField: this.selectedField, filterValue: this.filterValue, filterOperator: this.filterOperator, isLoading: this.isLoading });
        },
        error: (error: any) => {
          console.error('onFieldChange: getCollectionData error:', error);
          this.errorMessage = error.status === 404
            ? `Base de données "${this.databaseName}" non trouvée`
            : `Erreur lors du chargement des données : ${error.message || error}`;
          this.groupedCountResult = {};
          this.totalCount = null;
          this.visibleColumns = [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      this.groupedCountResult = {};
      this.totalCount = null;
      this.visibleColumns = [];
      this.errorMessage = !this.databaseName ? 'Veuillez sélectionner une base de données' : null;
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  onFilterValueChange(): void {
    console.log('onFilterValueChange: filterValue:', this.filterValue);
    this.cdr.detectChanges();
  }

  onOperatorChange(): void {
    console.log('onOperatorChange: filterOperator:', this.filterOperator);
    this.cdr.detectChanges();
  }

  onDateInputModeChange(): void {
    console.log('onDateInputModeChange: dateInputMode:', this.dateInputMode);
    const fieldType = this.inferFieldType(this.selectedField);
    if (fieldType === 'date') {
      this.filterOperator = this.operatorOptions[this.getOperatorKey(fieldType)][0] || 'equals';
      this.filterValue = '';
      console.log('onDateInputModeChange: Reset filterOperator to:', this.filterOperator);
    }
    this.cdr.detectChanges();
  }

  applyFilter(): void {
    console.log('applyFilter: Applying filter with:', {
      collection: this.selectedCollection,
      field: this.selectedField,
      operator: this.filterOperator,
      value: this.filterValue,
      isLoading: this.isLoading,
    });
    if (!this.selectedField || !this.selectedCollection || !this.databaseName || !this.filterValue) {
      this.errorMessage = 'Veuillez sélectionner une collection, un champ, un opérateur et entrer une valeur';
      this.clearChart();
      this.cdr.detectChanges();
      return;
    }

    const fieldType = this.inferFieldType(this.selectedField);
    const operatorKey = this.getOperatorKey(fieldType);
    if (!this.operatorOptions[operatorKey]?.includes(this.filterOperator)) {
      this.errorMessage = `Opérateur "${this.filterOperator}" non supporté pour le type ${fieldType}`;
      this.clearChart();
      this.cdr.detectChanges();
      return;
    }

    if (fieldType === 'integer') {
      const numValue = Number(this.filterValue);
      if (isNaN(numValue)) {
        this.errorMessage = 'La valeur doit être un nombre valide';
        this.clearChart();
        this.cdr.detectChanges();
        return;
      }
      this.filterValue = numValue.toString();
    }

    if (fieldType === 'boolean') {
      if (!['true', 'false'].includes(this.filterValue.toLowerCase())) {
        this.errorMessage = 'La valeur doit être "true" ou "false"';
        this.clearChart();
        this.cdr.detectChanges();
        return;
      }
      this.filterValue = this.filterValue.toLowerCase();
    }

    if (fieldType === 'date') {
      const isYear = /^\d{4}$/.test(this.filterValue);
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(this.filterValue);
      const isISODate = this.filterValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/);
      if (!isYear && !isDate && !isISODate) {
        this.errorMessage = 'La valeur doit être une année (YYYY, ex: 2025), une date (YYYY-MM-DD, ex: 2025-01-01), ou une date ISO (YYYY-MM-DDTHH:mm:ss, ex: 2025-01-01T00:00:00)';
        this.clearChart();
        this.cdr.detectChanges();
        return;
      }
      if (isYear && this.dateInputMode === 'date') {
        this.errorMessage = 'Une année (YYYY) n\'est pas autorisée en mode date. Utilisez une date complète (YYYY-MM-DD) ou passez en mode année.';
        this.clearChart();
        this.cdr.detectChanges();
        return;
      }
      if ((isDate || isISODate) && this.dateInputMode === 'year') {
        this.errorMessage = 'Une date complète (YYYY-MM-DD ou ISO) n\'est pas autorisée en mode année. Utilisez une année (YYYY) ou passez en mode date.';
        this.clearChart();
        this.cdr.detectChanges();
        return;
      }
      if (isDate) {
        this.filterValue = `${this.filterValue}T00:00:00`; // Convert YYYY-MM-DD to ISO
      }
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    this.databaseService
      .filterByField(this.databaseName, this.selectedCollection, this.selectedField, this.filterOperator, this.filterValue)
      .subscribe({
        next: (data: any[]) => {
          console.log('applyFilter: filterByField response:', data);
          this.collectionData = data;
          this.groupedCountResult = this.countByField(data, this.selectedField);
          this.totalCount = Object.values(this.groupedCountResult).reduce((sum, count) => sum + count, 0);
          this.visibleColumns = Object.keys(this.groupedCountResult);
          this.errorMessage = null;
          this.isLoading = false;
          if (this.displayMode === 'chart') {
            this.updateChart();
          }
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('applyFilter: filterByField error:', error);
          this.errorMessage = error.status === 404
            ? `Base de données "${this.databaseName}" non trouvée`
            : `Erreur lors du filtrage : ${error.message || error}`;
          this.collectionData = [];
          this.groupedCountResult = {};
          this.totalCount = null;
          this.visibleColumns = [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  public inferFieldType(field: string): string {
    if (!this.collectionData.length || !field) return 'string';
    const value = this.collectionData.find(item => item[field] !== null && item[field] !== undefined)?.[field];
    if (value === undefined) return 'string';
    if (typeof value === 'number') return 'integer';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/)) return 'date';
    return 'string';
  }

  public getOperatorKey(fieldType: string): string {
    return fieldType === 'date' && this.dateInputMode === 'year' ? 'date_year' : fieldType;
  }

  public getPattern(field: string): string {
    const fieldType = this.inferFieldType(field);
    if (fieldType === 'date') {
      return this.dateInputMode === 'year' ? '^\\d{4}$' : '^\\d{4}-\\d{2}-\\d{2}$|^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?(Z|[+-]\\d{2}:\\d{2})?$';
    }
    return '';
  }

  private extractFieldNames(data: any[]): string[] {
    const fieldNames = new Set<string>();
    if (data && data.length > 0) {
      data.forEach((item) => {
        Object.keys(item).forEach((key) => {
          if (key !== '_id') {
            fieldNames.add(key);
          }
        });
      });
    }
    console.log('extractFieldNames: Extracted fields:', Array.from(fieldNames));
    return Array.from(fieldNames);
  }

  private countByField(data: any[], field: string): { [key: string]: number } {
    const result: { [key: string]: number } = {};
    data.forEach((item) => {
      let value = item[field];
      if (value === null || value === undefined) {
        value = 'Inconnu';
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        value = value.toString();
      } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\\d{2})?$/)) {
        value = new Date(value).toISOString();
      }
      result[value] = (result[value] || 0) + 1;
    });
    console.log('countByField: Count result for field', field, ':', result);
    return result;
  }

  onDisplayModeChange(): void {
    console.log('onDisplayModeChange: Display mode:', this.displayMode);
    if (this.displayMode === 'chart' && this.groupedCountResult && this.hasData()) {
      this.updateChart();
    } else {
      this.clearChart();
    }
    this.cdr.detectChanges();
  }

  removeColumn(column: string): void {
    console.log('removeColumn: Removing column:', column);
    this.visibleColumns = this.visibleColumns.filter((col) => col !== column);
    this.cdr.detectChanges();
  }

  hasData(): boolean {
    const hasData = this.groupedCountResult && Object.keys(this.groupedCountResult).length > 0;
    console.log('hasData:', hasData);
    return hasData;
  }

  private updateChart(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('updateChart: Skipped (server-side)');
      return;
    }
    console.log('updateChart: Attempting to update chart');
    this.showChart = true;
    this.cdr.detectChanges();

    this.zone.runOutsideAngular(() => {
      if (!this.chart && this.chartElement?.nativeElement) {
        try {
          console.log('updateChart: Initializing chart');
          this.chart = echarts.init(this.chartElement!.nativeElement);
        } catch (error) {
          console.error('updateChart: Chart initialization failed:', error);
          this.showChart = false;
          this.cdr.detectChanges();
          return;
        }
      }

      if (this.chart) {
        this.renderChart();
      } else {
        console.error('updateChart: No chart instance available');
        this.showChart = false;
        this.cdr.detectChanges();
      }
    });
  }

  private renderChart(): void {
    if (!this.chart) {
      console.error('renderChart: No chart instance');
      return;
    }

    const labels = Object.keys(this.groupedCountResult);
    const values = Object.values(this.groupedCountResult);
    const nbValues = labels.length;
    console.log('renderChart: Chart data:', { labels, values, nbValues, selectedField: this.selectedField });

    let option: echarts.EChartsOption;

    if (nbValues === 0 || !this.selectedField) {
      option = { title: { text: 'Aucune donnée à afficher', left: 'center' } };
    } else if (nbValues === 1) {
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
            axisLine: { lineStyle: { width: 15, color: [[1, '#1890ff']] } },
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
            emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
            labelLine: { show: false },
            data: labels.map((label, i) => ({ value: values[i], name: label })),
          },
        ],
      };
    } else {
      option = {
        title: { text: `Répartition par ${this.selectedField}`, left: 'center' },
        tooltip: {},
        radar: {
          indicator: labels.map((label) => ({ name: label, max: Math.max(...values) + 2 })),
        },
        series: [
          {
            name: this.selectedField,
            type: 'radar',
            data: [{ value: values, name: this.selectedField }],
          },
        ],
      };
    }

    try {
      this.chart.setOption(option, true);
      this.chart.resize();
      console.log('renderChart: Chart updated successfully');
    } catch (error) {
      console.error('renderChart: Chart update failed:', error);
      this.showChart = false;
      this.cdr.detectChanges();
    }
  }

  private clearChart(): void {
    console.log('clearChart: Clearing chart');
    this.showChart = false;
    if (isPlatformBrowser(this.platformId) && this.chart) {
      this.chart.clear();
    }
    this.cdr.detectChanges();
  }

  private clearForm(): void {
    console.log('clearForm: Clearing form');
    this.fieldNames = [];
    this.selectedField = '';
    this.filterOperator = 'equals';
    this.filterValue = '';
    this.dateInputMode = 'date';
    this.groupedCountResult = {};
    this.totalCount = null;
    this.visibleColumns = [];
    this.clearChart();
    this.cdr.detectChanges();
  }

  private previousField: string | null = null;
}
