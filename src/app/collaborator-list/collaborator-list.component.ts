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
  pageSize: number = 20; // Nombre d'éléments par page
  currentPage: number = 1; // Page actuelle
  paginatedCollaborators: any[] = [];
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

  // Redirige vers la page des détails du collaborateur
  //viewCollaboratorDetails(collaboratorId: number): void {
    //this.router.navigate(['/collaborator', collaboratorId]);
  //}

  // Changer la page
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
}
