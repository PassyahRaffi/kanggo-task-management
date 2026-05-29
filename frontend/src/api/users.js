import api from './axios';
export const getUsers        = ()     => api.get('/users');
export const getMe           = ()     => api.get('/users/me');
export const updateMe        = (data) => api.put('/users/me', data);
export const updatePassword  = (data) => api.put('/users/me/password', data);
