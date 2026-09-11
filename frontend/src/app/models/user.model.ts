export interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  phoneNumber: string;
  department?: string;
  role: 'Customer' | 'hbl_emp' | 'admin' | string;
  token?: string;
}

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  username: string;
  phoneNumber: string;
  department?: string;
  role: 'Customer' | 'hbl_emp' | 'admin' | string;
  token: string;
}
