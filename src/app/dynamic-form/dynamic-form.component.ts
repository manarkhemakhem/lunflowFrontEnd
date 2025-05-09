import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, NgZone, Inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as echarts from 'echarts';
import { isPlatformBrowser } from '@angular/common';



interface Filter {
  field: string;
  operator: string;
  value: string;
  values: any[];
  dateInputMode: 'date' | 'year';
}

interface FieldOperation {
  field: string;
  operation: 'none' | 'count' | 'avg' | 'percentage';
}


@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.css'],
})
export class DynamicFormComponent implements OnInit, AfterViewInit, OnDestroy {
  collections: string[] = ['group', 'user', 'collaborator'];
  selectedCollection: string = '';
  collectionData: any[] = [];
  fieldNames: string[] = [];
  selectedDisplayFields: FieldOperation[] = [];
  tempSelectedDisplayFields: FieldOperation[] = [];
  displayMode: 'table' | 'chart' = 'table';
  useFilter: boolean = false;
  filters: Filter[] = [];
  databaseName: string = '';
  groupedCountResult: { [key: string]: number } = {};
  aggregatedResults: { [field: string]: any } = {};
  totalCount: number | null = null;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  showChart: boolean = false;

  // Pagination for fields
  fieldsCurrentPage: number = 1;
  fieldsPageSize: number = 5;
  fieldsTotalPages: number = 0;

  // Pagination for table
  tableCurrentPage: number = 1;
  tablePageSize: number = 10;
  tableTotalPages: number = 0;

  // Store original field names for filters and reset
  originalFieldNames: string[] = [];

  operatorOptions: { [key: string]: string[] } = {
    string: ['equals', 'notequals', 'contains', 'notcontains', 'startswith', 'endswith', 'regex'],
    boolean: ['equals', 'notequals'],
    integer: ['equals', 'notequals', 'greaterthan', 'lessthan'],
    date: ['equals', 'greaterthan', 'lessthan', 'dateafter'],
    date_year: ['equalsyear'],
  };

  operationOptions: string[] = ['none', 'count', 'avg', 'percentage'];

  @ViewChild('chart') chartElement?: ElementRef;
  private chart: echarts.ECharts | null = null;

  constructor(
    private databaseService: DatabaseService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
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
        this.loadCollections();
      }
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && this.chartElement?.nativeElement) {
      this.zone.runOutsideAngular(() => {
        try {
          this.chart = echarts.init(this.chartElement!.nativeElement);
          window.addEventListener('resize', this.resizeChart);
        } catch (e) {
          console.error("Erreur lors de l'initialisation d'ECharts:", e);
          this.errorMessage = 'Impossible d\'initialiser le graphique';
          this.cdr.detectChanges();
        }
      });
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

  loadCollections(): void {
    this.collections = ['group', 'user', 'collaborator'];
    this.cdr.detectChanges();
  }

  onCollectionSelect(): void {
    if (!this.selectedCollection || !this.databaseName) {
      this.clearForm();
      this.errorMessage = !this.databaseName ? 'Veuillez sélectionner une base de données' : null;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.fieldNames = [];
    this.originalFieldNames = [];
    this.selectedDisplayFields = [];
    this.tempSelectedDisplayFields = [];
    this.filters = [];
    this.collectionData = [];
    this.fieldsCurrentPage = 1;
    this.tableCurrentPage = 1;
    this.cdr.detectChanges();

    this.databaseService.getFields(this.databaseName, this.selectedCollection).subscribe({
      next: (fields: string[]) => {
        this.fieldNames = fields;
        this.originalFieldNames = [...fields];
        this.updateFieldsPagination();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.errorMessage = error.status === 404
          ? `Base de données "${this.databaseName}" ou collection "${this.selectedCollection}" non trouvée`
          : `Erreur lors du chargement des champs : ${error.message || error}`;
        this.fieldNames = [];
        this.originalFieldNames = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  updateFieldsPagination(): void {
    this.fieldsTotalPages = Math.ceil(this.fieldNames.length / this.fieldsPageSize);
    this.fieldsCurrentPage = Math.min(this.fieldsCurrentPage, this.fieldsTotalPages || 1);
    this.cdr.detectChanges();
  }

  getPaginatedFields(): string[] {
    const start = (this.fieldsCurrentPage - 1) * this.fieldsPageSize;
    const end = start + this.fieldsPageSize;
    return this.fieldNames.slice(start, end);
  }

  changeFieldsPage(page: number): void {
    if (page >= 1 && page <= this.fieldsTotalPages) {
      this.fieldsCurrentPage = page;
      this.cdr.detectChanges();
    }
  }

  isFieldSelected(field: string): boolean {
    return !!this.tempSelectedDisplayFields.find(f => f.field === field);
  }

  onDisplayFieldsChange(field: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.tempSelectedDisplayFields.find(f => f.field === field)) {
        this.tempSelectedDisplayFields.push({ field, operation: 'none' });
      }
    } else {
      this.tempSelectedDisplayFields = this.tempSelectedDisplayFields.filter(f => f.field !== field);
    }
    this.cdr.detectChanges();
  }

  getFieldOperation(field: string): string {
    const fieldOp = this.tempSelectedDisplayFields.find(f => f.field === field);
    return fieldOp ? fieldOp.operation : 'none';
  }

  onOperationChange(field: string, operation: string): void {
    const fieldOp = this.tempSelectedDisplayFields.find(f => f.field === field);
    if (fieldOp) {
      fieldOp.operation = operation as 'none' | 'count' | 'avg' | 'percentage';
    }
    this.cdr.detectChanges();
  }

  hasAvgOrPercentageOperation(): boolean {
    return this.selectedDisplayFields.some(f => f.operation === 'avg' || f.operation === 'percentage');
  }

  validateFields(): void {
    if (this.tempSelectedDisplayFields.length === 0) {
      this.errorMessage = 'Veuillez sélectionner au moins un champ à afficher';
      this.cdr.detectChanges();
      return;
    }

    this.selectedDisplayFields = [...this.tempSelectedDisplayFields];
    this.fieldNames = this.selectedDisplayFields.map(f => f.field);
    this.fieldsCurrentPage = 1;
    this.updateFieldsPagination();
    this.applyFilter();
    this.cdr.detectChanges();
  }

  resetFields(): void {
    this.fieldNames = [...this.originalFieldNames];
    this.selectedDisplayFields = [];
    this.tempSelectedDisplayFields = [];
    this.fieldsCurrentPage = 1;
    this.updateFieldsPagination();
    this.collectionData = [];
    this.groupedCountResult = {};
    this.aggregatedResults = {};
    this.totalCount = null;
    this.clearChart();
    this.cdr.detectChanges();
  }

  updateTablePagination(): void {
    this.tableTotalPages = Math.ceil(this.collectionData.length / this.tablePageSize);
    this.tableCurrentPage = Math.min(this.tableCurrentPage, this.tableTotalPages || 1);
    this.cdr.detectChanges();
  }

  getPaginatedTableData(): any[] {
    const start = (this.tableCurrentPage - 1) * this.tablePageSize;
    const end = start + this.tablePageSize;
    return this.collectionData.slice(start, end);
  }

  changeTablePage(page: number): void {
    if (page >= 1 && page <= this.tableTotalPages) {
      this.tableCurrentPage = page;
      this.cdr.detectChanges();
    }
  }

  getTableCountInfo(): string {
    const start = (this.tableCurrentPage - 1) * this.tablePageSize + 1;
    const end = Math.min(this.tableCurrentPage * this.tablePageSize, this.collectionData.length);
    return `Affichage de ${start} à ${end} sur ${this.collectionData.length} lignes`;
  }

  addFilter(): void {
    this.filters.push({
      field: '',
      operator: 'equals',
      value: '',
      values: [],
      dateInputMode: 'date',
    });
    this.cdr.detectChanges();
  }

  removeFilter(index: number): void {
    this.filters.splice(index, 1);
    if (this.filters.length === 0) {
      this.useFilter = false;
    }
    this.applyFilter();
    this.cdr.detectChanges();
  }

  onFilterFieldChange(index: number): void {
    const filter = this.filters[index];
    const fieldType = this.inferFieldType(filter.field);
    const operatorKey = this.getOperatorKey(fieldType, filter.dateInputMode);
    if (filter.field && !this.operatorOptions[operatorKey]?.includes(filter.operator)) {
      filter.operator = this.operatorOptions[operatorKey][0] || 'equals';
    }
    filter.value = '';
    filter.values = [];

    if (filter.field && this.selectedCollection && this.databaseName) {
      this.loadFilterValues(index);
    }
    this.cdr.detectChanges();
  }

  loadFilterValues(index: number): void {
    const filter = this.filters[index];
    this.isLoading = true;
    this.cdr.detectChanges();

    this.databaseService
      .filterFieldValues(this.databaseName, this.selectedCollection, filter.field, false)
      .subscribe({
        next: (values: any[]) => {
          filter.values = values;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.errorMessage = `Erreur lors du chargement des valeurs pour "${filter.field}": ${error.message || error}`;
          filter.values = [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onDateInputModeChange(index: number): void {
    const filter = this.filters[index];
    const fieldType = this.inferFieldType(filter.field);
    const operatorKey = this.getOperatorKey(fieldType, filter.dateInputMode);
    if (filter.field && !this.operatorOptions[operatorKey]?.includes(filter.operator)) {
      filter.operator = this.operatorOptions[operatorKey][0] || 'equals';
    }
    filter.value = '';
    this.cdr.detectChanges();
  }

  onDisplayModeChange(): void {
    if (this.displayMode === 'chart' && this.aggregatedResults && Object.keys(this.aggregatedResults).length > 0) {
      this.updateChart();
    } else {
      this.clearChart();
    }
    this.cdr.detectChanges();
  }

  onUseFilterChange(): void {
    if (!this.useFilter) {
      this.filters = [];
      this.applyFilter();
    } else {
      this.addFilter();
    }
    this.cdr.detectChanges();
  }

  applyFilter(): void {
    if (!this.selectedCollection || !this.databaseName || this.selectedDisplayFields.length === 0) {
      this.errorMessage = 'Veuillez sélectionner une base de données, une collection et au moins un champ à afficher';
      this.collectionData = [];
      this.groupedCountResult = {};
      this.aggregatedResults = {};
      this.totalCount = null;
      this.clearChart();
      this.cdr.detectChanges();
      return;
    }

    if (this.useFilter && this.filters.length > 0) {
      for (const filter of this.filters) {
        if (!filter.field || !filter.value) {
          this.errorMessage = 'Veuillez sélectionner un champ et une valeur pour chaque filtre';
          this.collectionData = [];
          this.groupedCountResult = {};
          this.aggregatedResults = {};
          this.totalCount = null;
          this.clearChart();
          this.cdr.detectChanges();
          return;
        }

        const fieldType = this.inferFieldType(filter.field);
        const operatorKey = this.getOperatorKey(fieldType, filter.dateInputMode);
        if (!this.operatorOptions[operatorKey]?.includes(filter.operator)) {
          this.errorMessage = `Opérateur "${filter.operator}" non supporté pour le type ${fieldType}`;
          this.clearChart();
          this.cdr.detectChanges();
          return;
        }

        if (fieldType === 'integer') {
          const numValue = Number(filter.value);
          if (isNaN(numValue)) {
            this.errorMessage = `La valeur pour "${filter.field}" doit être un nombre valide`;
            this.clearChart();
            this.cdr.detectChanges();
            return;
          }
          filter.value = numValue.toString();
        }

        if (fieldType === 'boolean') {
          if (!['true', 'false'].includes(filter.value.toLowerCase())) {
            this.errorMessage = `La valeur pour "${filter.field}" doit être "true" ou "false"`;
            this.clearChart();
            this.cdr.detectChanges();
            return;
          }
          filter.value = filter.value.toLowerCase();
        }

        if (fieldType === 'string' && filter.operator === 'regex') {
          try {
            new RegExp(filter.value);
          } catch (e) {
            this.errorMessage = `Valeur regex invalide pour "${filter.field}"`;
            this.clearChart();
            this.cdr.detectChanges();
            return;
          }
        }

        if (fieldType === 'date') {
          const isYear = /^\d{4}$/.test(filter.value);
          const isDate = /^\d{4}-\d{2}-\d{2}$/.test(filter.value);
          const isISODate = filter.value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/);
          if (!isYear && !isDate && !isISODate) {
            this.errorMessage = `La valeur pour "${filter.field}" doit être une année (YYYY), une date (YYYY-MM-DD), ou une date ISO`;
            this.clearChart();
            this.cdr.detectChanges();
            return;
          }
          if (isYear && filter.dateInputMode === 'date') {
            this.errorMessage = `Année non autorisée en mode date pour "${filter.field}". Utilisez YYYY-MM-DD ou passez en mode année.`;
            this.clearChart();
            this.cdr.detectChanges();
            return;
          }
          if ((isDate || isISODate) && filter.dateInputMode === 'year') {
            this.errorMessage = `Date complète non autorisée en mode année pour "${filter.field}". Utilisez YYYY ou passez en mode date.`;
            this.clearChart();
            this.cdr.detectChanges();
            return;
          }
          if (isDate) {
            filter.value = `${filter.value}T00:00:00`;
          }
        }
      }
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.detectChanges();

    const apiCall = this.useFilter && this.filters.length > 0
      ? this.databaseService.filterByFields(
          this.databaseName,
          this.selectedCollection,
          this.filters.map(f => ({
            field: f.field,
            operator: f.operator,
            value: this.inferFieldType(f.field) === 'string' ? f.value.toLowerCase() : f.value
          }))
        )
      : this.databaseService.getCollectionData(this.databaseName, this.selectedCollection);

    apiCall.subscribe({
      next: (data: any[]) => {
        // Convert string field values to lowercase for consistency in frontend processing
        this.collectionData = data.map(item => {
          const newItem = { ...item };
          this.selectedDisplayFields.forEach(({ field }) => {
            if (this.inferFieldType(field) === 'string' && newItem[field] != null) {
              newItem[field] = newItem[field].toString().toLowerCase();
            }
          });
          return newItem;
        });
        this.aggregatedResults = this.computeAggregatedResults(this.collectionData);
        this.totalCount = this.collectionData.length;
        this.updateTablePagination();
        this.isLoading = false;
        if (this.displayMode === 'chart') {
          this.updateChart();
        }
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.errorMessage = error.status === 404
          ? `Base de données "${this.databaseName}" ou collection "${this.selectedCollection}" non trouvée`
          : `Erreur: ${error.message || error}`;
        this.collectionData = [];
        this.groupedCountResult = {};
        this.aggregatedResults = {};
        this.totalCount = null;
        this.isLoading = false;
        this.clearChart();
        this.cdr.detectChanges();
      },
    });
  }

  computeAggregatedResults(data: any[]): { [field: string]: any } {
    const results: { [field: string]: any } = {};
    this.selectedDisplayFields.forEach(({ field, operation }) => {
      if (operation === 'none') {
        results[field] = data.map(item => item[field]);
      } else if (operation === 'count') {
        results[field] = this.countByField(data, field);
      } else if (operation === 'avg') {
        const fieldType = this.inferFieldType(field);
        if (fieldType !== 'integer') {
          results[field] = `Moyenne non applicable pour ${field} (type ${fieldType})`;
        } else {
          const values = data
            .map(item => Number(item[field]))
            .filter(val => !isNaN(val));
          const avg = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
          results[field] = avg.toFixed(2);
        }
      } else if (operation === 'percentage') {
        const counts = this.countByField(data, field);
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
        results[field] = Object.keys(counts).reduce((acc, key) => {
          acc[key] = total > 0 ? ((counts[key] / total) * 100).toFixed(2) + '%' : '0%';
          return acc;
        }, {} as { [key: string]: string });
      }
    });
    return results;
  }

  inferFieldType(field: string): string {
    if (!this.collectionData.length || !field) return 'string';
    const value = this.collectionData.find(item => item[field] !== null && item[field] !== undefined)?.[field];
    if (value === undefined) return 'string';
    if (typeof value === 'number') return 'integer';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/)) return 'date';
    return 'string';
  }

  getOperatorKey(fieldType: string, dateInputMode: 'date' | 'year' = 'date'): string {
    return fieldType === 'date' && dateInputMode === 'year' ? 'date_year' : fieldType;
  }

  countByField(data: any[], field: string): { [key: string]: number } {
    const result: { [key: string]: number } = {};
    const fieldType = this.inferFieldType(field);
    data.forEach((item) => {
      let value = item[field];
      if (value === null || value === undefined) {
        value = 'Inconnu';
      } else if (fieldType === 'string') {
        value = value.toString().toLowerCase(); // Case-insensitive for strings
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        value = value.toString();
      } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/)) {
        value = new Date(value).toISOString().split('T')[0];
      }
      result[value] = (result[value] || 0) + 1;
    });
    return result;
  }

  hasData(): boolean {
    return this.aggregatedResults && Object.keys(this.aggregatedResults).length > 0;
  }

  updateChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.showChart = true;
    this.cdr.detectChanges();

    this.zone.runOutsideAngular(() => {
      if (!this.chart && this.chartElement?.nativeElement) {
        try {
          this.chart = echarts.init(this.chartElement!.nativeElement);
        } catch (e) {
          console.error("Erreur lors de l'initialisation d'ECharts:", e);
          this.errorMessage = 'Impossible d\'initialiser le graphique';
          this.showChart = false;
          this.cdr.detectChanges();
          return;
        }
      }

      if (this.chart) {
        this.renderChart();
      } else {
        this.showChart = false;
        this.cdr.detectChanges();
      }
    });
  }

  renderChart(): void {
    if (!this.chart) return;

    const chartField = this.selectedDisplayFields[0]?.field || '';
    const operation = this.selectedDisplayFields[0]?.operation || 'none';
    let labels: string[] = [];
    let values: number[] = [];
    let option: echarts.EChartsOption;

    if (!chartField || !this.aggregatedResults[chartField]) {
      option = { title: { text: 'Aucune donnée à afficher', left: 'center' } };
    } else if (operation === 'none') {
      const counts = this.countByField(this.collectionData, chartField);
      labels = Object.keys(counts);
      values = Object.values(counts);
      const nbValues = labels.length;

      if (nbValues === 0) {
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
          title: { text: `Répartition par ${chartField}`, left: 'center' },
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
          title: { text: `Répartition par ${chartField}`, left: 'center' },
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
          title: { text: `Répartition par ${chartField}`, left: 'center' },
          tooltip: {},
          radar: {
            indicator: labels.map((label) => ({ name: label, max: Math.max(...values) + 2 })),
          },
          series: [
            {
              name: chartField,
              type: 'radar',
              data: [{ value: values, name: chartField }],
            },
          ],
        };
      }
    } else if (operation === 'count') {
      labels = Object.keys(this.aggregatedResults[chartField]);
      values = Object.values(this.aggregatedResults[chartField]);
      const nbValues = labels.length;

      if (nbValues === 0) {
        option = { title: { text: 'Aucune donnée à afficher', left: 'center' } };
      } else if (nbValues === 1) {
        option = {
          title: { text: `Comptage: ${labels[0]}`, left: 'center' },
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
      } else {
        option = {
          title: { text: `Comptage par ${chartField}`, left: 'center' },
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
      }
    } else if (operation === 'avg') {
      const avgValue = parseFloat(this.aggregatedResults[chartField]);
      option = {
        title: { text: `Moyenne de ${chartField}`, left: 'center' },
        series: [
          {
            type: 'gauge',
            startAngle: 180,
            endAngle: 0,
            center: ['50%', '75%'],
            radius: '90%',
            min: 0,
            max: avgValue * 2 || 100,
            axisLine: { lineStyle: { width: 15, color: [[1, '#1890ff']] } },
            pointer: { show: true },
            title: { show: true, offsetCenter: [0, '-30%'] },
            detail: {
              valueAnimation: true,
              formatter: '{value}',
              fontSize: 20,
              offsetCenter: [0, '-10%'],
            },
            data: [{ value: avgValue, name: 'Moyenne' }],
          },
        ],
      };
    } else if (operation === 'percentage') {
      labels = Object.keys(this.aggregatedResults[chartField]);
      values = Object.values(this.aggregatedResults[chartField]).map((val: any) => parseFloat(val.replace('%', '')));
      option = {
        title: { text: `Pourcentage par ${chartField}`, left: 'center' },
        tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
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
      option = { title: { text: 'Aucune donnée à afficher', left: 'center' } };
    }

    this.chart.setOption(option, true);
    this.chart.resize();
  }

  clearChart(): void {
    this.showChart = false;
    if (isPlatformBrowser(this.platformId) && this.chart) {
      this.chart.clear();
    }
    this.cdr.detectChanges();
  }

  clearForm(): void {
    this.selectedCollection = '';
    this.fieldNames = [];
    this.originalFieldNames = [];
    this.selectedDisplayFields = [];
    this.tempSelectedDisplayFields = [];
    this.filters = [];
    this.useFilter = false;
    this.displayMode = 'table';
    this.collectionData = [];
    this.groupedCountResult = {};
    this.aggregatedResults = {};
    this.totalCount = null;
    this.fieldsCurrentPage = 1;
    this.tableCurrentPage = 1;
    this.clearChart();
    this.cdr.detectChanges();
  }
}
