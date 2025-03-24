import { Routes } from '@angular/router';
import { DashboardComponent } from './collaborator/dashboard.component';
import { GroupComponent } from './group/group.component';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'group', component: GroupComponent },

  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
];
