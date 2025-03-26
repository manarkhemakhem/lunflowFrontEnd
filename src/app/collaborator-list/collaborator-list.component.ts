import { Component, OnInit } from '@angular/core';
import { CollaboratorService } from '../collaborator.service';
import { Router } from '@angular/router';
import { HeaderComponent } from "../header/header.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-collaborator-list',
  standalone: true,
  imports: [HeaderComponent,CommonModule],
  templateUrl: './collaborator-list.component.html',
  styleUrls: ['./collaborator-list.component.css']
})
export class CollaboratorListComponent implements OnInit {
  collaborators: any[] = [];
  pageSize: number = 20;
  currentPage: number = 1;
  paginatedCollaborators: any[] = [];

  isModalOpen: boolean = false; // Pour gérer l'ouverture et la fermeture du modal
  selectedCollaborator: any = null; // Collaborateur sélectionné pour afficher dans le modal


  constructor(
    private collaboratorService: CollaboratorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getCollaborators(); // Récupération des collaborateurs lors de l'initialisation
  }

  // Récupère la liste des collaborateurs depuis le service
  getCollaborators(): void {
    this.collaboratorService.getAllCollaborators().subscribe(
      (data) => {
        this.collaborators = data; // Assigner les collaborateurs récupérés
      },
      (error) => {
        console.error('Erreur de chargement des collaborateurs', error);
      }
    );
  }

  updatePaginatedCollaborators(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedCollaborators = this.collaborators.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page > 0 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.updatePaginatedCollaborators();
    }
  }

  // Obtenir le nombre total de pages
  getTotalPages(): number {
    return Math.ceil(this.collaborators.length / this.pageSize);
  }


   // Ouvre le modal avec les détails du collaborateur
   openProfile(collaborator: any): void {
    this.selectedCollaborator = collaborator;
    this.isModalOpen = true;
  }

  // Ferme le modal
  closeModal(): void {
    this.isModalOpen = false;
    this.selectedCollaborator = null; // Réinitialiser le collaborateur sélectionné
  }
}
