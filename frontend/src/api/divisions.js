import api from './axios';

export const getDivisions  = ()        => api.get('/divisions');
export const createDivision = (data)   => api.post('/divisions', data);
export const updateDivision = (id, data) => api.put(`/divisions/${id}`, data);
export const deleteDivision = (id)     => api.delete(`/divisions/${id}`);
