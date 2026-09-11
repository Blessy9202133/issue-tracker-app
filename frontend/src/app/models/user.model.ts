export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'REPORTER' | 'ASSIGNEE' | 'ADMIN';
  token?: string;
}

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  role: 'REPORTER' | 'ASSIGNEE' | 'ADMIN';
  token: string;
}
