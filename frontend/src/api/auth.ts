import api from './client';

export interface UserInfo {
  id: string;
  username: string;
  role: 'ADMIN' | 'STAFF';
}

export const getUserInfo = async (): Promise<UserInfo | null> => {
  try {
    const token = localStorage.getItem('dacosta_token');
    if (!token) return null;
    
    const response = await api.get('/auth/me');
    return response.data;
  } catch {
    return null;
  }
};

export const decodeToken = (): UserInfo | null => {
  try {
    const token = localStorage.getItem('dacosta_token');
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const decoded = JSON.parse(atob(parts[1]));
    return {
      id: decoded.sub,
      username: decoded.username,
      role: decoded.role,
    };
  } catch {
    return null;
  }
};
