import { Routes } from '@angular/router';
import { DashboardComponent } from './collaborator/dashboard.component';
import { GroupComponent } from './group/group.component';
import { CollaboratorListComponent } from './collaborator-list/collaborator-list.component';
import { UserComponent } from './user/user.component';
import { DynamicFormComponent } from './dynamic-form/dynamic-form.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: 'form', component: DynamicFormComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'group', component: GroupComponent },
  { path: 'collablist', component: CollaboratorListComponent },
  { path: 'user', component: UserComponent },
  { path: '', component: HomeComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
