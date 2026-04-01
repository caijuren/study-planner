export interface User {
  id: number;
  name: string;
  role: 'parent' | 'child';
  familyId?: number;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  familyCode?: string;
  userName?: string;
  username?: string;
  password: string;
}

export interface ChildLoginCredentials {
  familyCode: string;
  childName: string;
  pin: string;
}

export interface RegisterData {
  familyName?: string;
  familyCode?: string;
  parentName?: string;
  parentPassword?: string;
  // Simplified registration
  username?: string;
  password?: string;
  role?: 'parent' | 'child';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Child {
  id: number;
  name: string;
  avatar: string;
  pin: string;
}

export interface Family {
  id: number;
  name: string;
  code: string;
  children: Child[];
}
