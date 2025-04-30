import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DashboardComponent } from "../collaborator/dashboard.component";
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-Sidenav',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './Sidenav.component.html',
  styleUrl: './Sidenav.component.css'
})
export class SidenavComponent {
  isSidebarOpen = false;
  @Output() sidebarToggled = new EventEmitter<boolean>();

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.sidebarToggled.emit(this.isSidebarOpen);
  }
  }


