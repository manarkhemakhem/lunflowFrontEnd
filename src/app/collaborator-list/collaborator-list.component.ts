import { Component, OnInit } from '@angular/core';
import { CollaboratorService } from '../services/collaborator.service';
import { Router } from '@angular/router';
import {  SidenavComponent } from "../Sidenav/Sidenav.component";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseComponent } from "../header/database/database.component";
@Component({
  selector: 'app-collaborator-list',
  standalone: true,
  imports: [ CommonModule, FormsModule, DatabaseComponent, SidenavComponent],
  templateUrl: './collaborator-list.component.html',
  styleUrls: ['./collaborator-list.component.css']
})
export class CollaboratorListComponent implements OnInit {

  collaborators: any[] = [];
  pageSize: number = 20;
  currentPage: number = 1;
  paginatedCollaborators: any[] = [];

  isModalOpen: boolean = false;
  selectedCollaborator: any = null;

  filteredCollaborators: any[] = [];
  searchTerm: string = '';


  constructor(
    private collaboratorService: CollaboratorService,
    private router: Router
  ) {}

  ngOnInit(): void {
  this.getCollaborators();
  }

  getCollaborators(): void {
    this.collaboratorService.getAllCollaborators().subscribe(
      (data) => {
        this.collaborators = data;
        this.filteredCollaborators = data;
        this.updatePaginatedCollaborators();
      },
      (error) => {
        console.error('Erreur de chargement des collaborateurs', error);
      }
    );
  }

  searchCollaborators(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCollaborators = this.collaborators;
    } else {
      this.filteredCollaborators = this.collaborators.filter(collaborator =>
        collaborator.fullname.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.currentPage = 1;
    this.updatePaginatedCollaborators();
  }

  updatePaginatedCollaborators(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedCollaborators = this.filteredCollaborators.slice(startIndex, endIndex);
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
  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']); // adapte cette route selon ton app
  }
}
