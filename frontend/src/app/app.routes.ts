import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CreateIssueComponent } from './components/create-issue/create-issue.component';
import { IssueDetailComponent } from './components/issue-detail/issue-detail.component';

export const routes: Routes = [
  { path: '', component: CreateIssueComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'create-issue', component: CreateIssueComponent },
  { path: 'create-issue/:id', component: CreateIssueComponent },
  { path: 'issues/:id', component: IssueDetailComponent },
  { path: 'login', redirectTo: '', pathMatch: 'full' },
  { path: 'register', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];

