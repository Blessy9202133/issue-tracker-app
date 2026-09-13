import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CreateIssueComponent } from './components/create-issue/create-issue.component';
import { IssueDetailComponent } from './components/issue-detail/issue-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'create-issue', component: CreateIssueComponent },
  { path: 'create-issue/:id', component: CreateIssueComponent },
  { path: 'issues/:id', component: IssueDetailComponent },
  { path: 'login', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'register', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];

