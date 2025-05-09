import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DatabaseComponent } from "./header/database/database.component";
import { SidenavComponent } from "./Sidenav/Sidenav.component";
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DatabaseComponent, SidenavComponent, CommonModule],
  template: `
    <ng-container *ngIf="showSkeleton; else homeContent">
      <div>
        <app-database (toggleSidebar)="toggleSidebar()"></app-database>
      </div>
      <div class="layout">
        <app-Sidenav [isSidebarOpen]="isSidebarOpen"></app-Sidenav>
        <main class="content" [class.expanded]="!isSidebarOpen">
          <router-outlet></router-outlet>
        </main>
      </div>
    </ng-container>
    <ng-template #homeContent>
      <router-outlet></router-outlet>
    </ng-template>
  `
})
export class AppComponent {
  title = 'lunflowFront';
  isSidebarOpen = false;
  showSkeleton = true;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Masquer le squelette pour la route '/' (page d'accueil)
        this.showSkeleton = event.urlAfterRedirects !== '/';
      });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
