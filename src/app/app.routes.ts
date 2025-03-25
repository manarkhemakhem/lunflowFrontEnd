import { Routes } from '@angular/router';
import { DashboardComponent } from './collaborator/dashboard.component';
import { GroupComponent } from './group/group.component';
import { CollaboratorListComponent } from './collaborator-list/collaborator-list.component';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'group', component: GroupComponent },
  { path: 'collablist', component: CollaboratorListComponent },



  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
];
