import { Routes } from '@angular/router';
import { DashboardComponent } from './collaborator/dashboard.component';
import { GroupComponent } from './group/group.component';
import { CollaboratorListComponent } from './collaborator-list/collaborator-list.component';
import { UserComponent } from './user/user.component';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'group', component: GroupComponent },
  { path: 'collablist', component: CollaboratorListComponent },
  { path: 'user', component: UserComponent },



  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
];
