export interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  phoneNumber: string;
  role: 'REPORTER' | 'ASSIGNEE' | 'ADMIN';
  token?: string;
}

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  username: string;
  phoneNumber: string;
  role: 'REPORTER' | 'ASSIGNEE' | 'ADMIN';
  token: string;
}
