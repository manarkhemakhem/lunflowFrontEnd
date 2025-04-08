import { Component, OnInit } from '@angular/core';
import { CollaboratorService } from '../services/collaborator.service';
import { UserService } from '../services/user.service';
import { GroupService } from '../services/group.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartService } from '../services/chart.service';
import * as echarts from 'echarts';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.css']
})
export class DynamicFormComponent  implements OnInit {
  selectedClass: string = '';
  availableAttributes: string[] = [];
  userData: any[] = [];
  groupData: any[] = [];
  collaboratorData: any[] = [];
  selectedAttribute: string = '';
  selectedAttributes: string[] = [];  // Liste des attributs sélectionnés
  inputValue: string = '';  // Stocke la valeur de l'entrée pour l'attribut sélectionné
  additionalInputValue: string = '';  // Stocke la valeur d'un autre champ d'entrée



  constructor(
    private collaboratorService: CollaboratorService,
    private userService: UserService,
    private groupService: GroupService
  ) {}

  ngOnInit(): void {
    this.loadClassData();
  }

  loadClassData(): void {
    if (this.selectedClass === 'collaborators') {
      this.collaboratorService.getAllCollaborators().subscribe(data => {
        this.collaboratorData = data;
        // Récupérer dynamiquement les clés de l'objet, qui correspondent aux attributs
        if (this.collaboratorData.length > 0) {
          this.availableAttributes = Object.keys(this.collaboratorData[0]);
        }
      });
    } else if (this.selectedClass === 'users') {
      this.userService.getAllUsers().subscribe(data => {
        this.userData = data;
        if (this.userData.length > 0) {
          this.availableAttributes = Object.keys(this.userData[0]);
        }
      });
    } else if (this.selectedClass === 'groups') {
      this.groupService.getAllGroups().subscribe(data => {
        this.groupData = data;
        if (this.groupData.length > 0) {
          this.availableAttributes = Object.keys(this.groupData[0]);
        }
      });
    }
  }
  addAttribute(): void {
    if (this.availableAttributes.length > 0) {
      this.selectedAttributes.push(this.availableAttributes[0]);  // Ajoute le premier attribut disponible comme valeur par défaut
    }
  }

  // Méthode pour supprimer un attribut de la liste des attributs sélectionnés
  removeAttribute(index: number): void {
    this.selectedAttributes.splice(index, 1);
  }

  // Méthode appelée lorsqu'un attribut est sélectionné
  onAttributeChange(index: number): void {
    console.log(`L'attribut du champ ${index + 1} a été changé`);
  }

  /* // Ajouter un input pour chaque attribut sélectionné
  addInput(input: string): void {
    if (!this.selectedInputs.includes(input)) {
      this.selectedInputs.push(input);
    }
  }

  // Supprimer un attribut sélectionné
  removeInput(input: string): void {
    const index = this.selectedInputs.indexOf(input);
    if (index >= 0) {
      this.selectedInputs.splice(index, 1);
      delete this.selectedOperations[input];
    }
  }

  // Ajouter une opération pour un attribut
  addOperation(input: string, operation: string): void {
    this.selectedOperations[input] = operation;
  }

  // Générer le graphique en fonction des attributs et des opérations
  generateChart(): void {
    const selectedData = this.selectedInputs;
    const operations = this.selectedOperations;

    selectedData.forEach(input => {
      const operation = operations[input];
      if (operation === 'count') {
        this.generateCountChart(input);
      } else if (operation === 'avg') {
        this.generateAvgChart(input);
      } else if (operation === 'sum') {
        this.generateSumChart(input);
      }
    });
  }

  // Générer le graphique pour l'opération "count"
  generateCountChart(input: string): void {
    let labels: string[] = [];
    let data: number[] = [];

    if (input === 'deleted') {
      const countTrue = this.collaboratorData.filter(collab => collab.deleted === true).length;
      const countFalse = this.collaboratorData.filter(collab => collab.deleted === false).length;

      labels = ['Deleted True', 'Deleted False'];
      data = [countTrue, countFalse];
    }

    this.generateBarChart(labels, data);
  }

  // Générer le graphique pour l'opération "avg"
  generateAvgChart(input: string): void {
    const avg = this.collaboratorData.reduce((sum, collab) => sum + (collab[input] || 0), 0) / this.collaboratorData.length;
    this.generateBarChart([input], [avg]);
  }

  // Générer le graphique pour l'opération "sum"
  generateSumChart(input: string): void {
    const sum = this.collaboratorData.reduce((total, collab) => total + (collab[input] || 0), 0);
    this.generateBarChart([input], [sum]);
  }

  // Fonction générique pour générer un graphique en barres
  generateBarChart(labels: string[], data: number[]): void {
    const chart = echarts.init(document.getElementById('chartElement') as HTMLElement);

    const option = {
      title: {
        text: this.chartOptions.title || 'Graphique Personnalisé',  // Titre personnalisé
      },
      color: [this.chartOptions.color],  // Couleur personnalisée
      legend: {
        show: this.chartOptions.legend,  // Affichage de la légende en fonction de la sélection
        data: labels,  // Légende basée sur les labels
      },
      xAxis: {
        type: 'category',
        data: labels,
      },
      yAxis: {
        type: 'value',
      },
      series: [{
        data: data,
        type: 'bar',
        label: {
          show: true,  // Afficher le label sur chaque barre
          position: 'top',  // Placer le label au-dessus de la barre
          formatter: '{c}',  // Afficher la valeur de chaque barre
        },
      }],
    };

    chart.setOption(option);
  } */
}
