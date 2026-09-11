import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CreateIssueComponent } from './components/create-issue/create-issue.component';
import { IssueDetailComponent } from './components/issue-detail/issue-detail.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'create-issue', component: CreateIssueComponent, canActivate: [authGuard] },
  { path: 'issues/:id', component: IssueDetailComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' },
];
