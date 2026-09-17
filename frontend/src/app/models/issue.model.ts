export interface Comment {
  _id?: string;
  user?: any;
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
  otherComplaintType?: string;
  shed?: string;
  locoNumber?: string;
  occurrenceDate?: string;
  occurrenceTime?: string;
  locoType?: string;
  brakeType?: string;
  failureType?: string;
  poLoaNumber?: string;
  details: string;
  issueRaisedDate: string;
  closedDate?: string;
  expectedCompletionDate?: string;
  analysis?: string;
  actionTaken?: string;
  preventiveAction?: string;
  photos: string[];
  analysisPhotos?: string[];
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdBy?: any;
  assignedTo?: any;
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
  otherComplaintType?: string;
  shed?: string;
  locoNumber?: string;
  occurrenceDate?: string;
  occurrenceTime?: string;
  locoType?: string;
  brakeType?: string;
  failureType?: string;
  poLoaNumber?: string;
  details: string;
  issueRaisedDate?: string;
  assignedTo?: string;
  photos?: File[];
}

export interface RespondIssueDto {
  comment?: string;
  expectedCompletionDate?: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  reassignTo?: string;
  analysis?: string;
  actionTaken?: string;
  preventiveAction?: string;
  complaintType?: string;
  otherComplaintType?: string;
  analysisPhotos?: File[];
  existingAnalysisPhotos?: string[];
}
