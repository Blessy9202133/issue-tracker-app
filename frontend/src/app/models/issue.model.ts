import { User } from './user.model';

export interface Comment {
  _id?: string;
  user: User;
  comment: string;
  targetDate?: string;
  createdAt?: string;
}

export interface Issue {
  _id: string;
  issueCode: string;
  zone: string;
  shed: string;
  details: string;
  issueRaisedDate: string;
  expectedCompletionDate?: string;
  photos: string[];
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdBy: User;
  assignedTo: User;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueDto {
  zone: string;
  shed: string;
  details: string;
  issueRaisedDate?: string;
  assignedTo: string;
  photos?: File[];
}

export interface RespondIssueDto {
  comment?: string;
  expectedCompletionDate?: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
}
