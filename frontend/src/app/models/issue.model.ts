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
  complaintCategory: 'WAYSIDE' | 'ONBOARD';
  zone: string;
  contract?: string;
  station?: string;
  complaintType?: string;
  shed?: string;
  locoNumber?: string;
  locoType?: string;
  brakeType?: string;
  failureType?: string;
  poLoaNumber?: string;
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
  complaintCategory: 'WAYSIDE' | 'ONBOARD';
  zone: string;
  contract?: string;
  station?: string;
  complaintType?: string;
  shed?: string;
  locoNumber?: string;
  locoType?: string;
  brakeType?: string;
  failureType?: string;
  poLoaNumber?: string;
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
