import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DatabaseComponent } from "./header/database/database.component";
import { SidenavComponent } from "./Sidenav/Sidenav.component";

@Component({
  selector: 'app-root',
  standalone: true,  // ✅ Important !
  imports: [RouterOutlet, DatabaseComponent, SidenavComponent], // ✅ Permet d'afficher les routes
  template: `<!-- <app-database></app-database> -->
<!-- <app-Sidenav ></app-Sidenav>
 -->  <router-outlet></router-outlet>`, // ✅ Pour afficher les composants selon les routes
})

export class AppComponent {
  title = 'lunflowFront';
  isSidebarOpen = false;

  onSidebarToggled(isOpen: boolean) {
    this.isSidebarOpen = isOpen;
  }
}

