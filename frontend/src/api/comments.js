import api from './axios';
export const getComments    = (taskId)              => api.get(`/tasks/${taskId}/comments`);
export const addComment     = (taskId, data)         => api.post(`/tasks/${taskId}/comments`, data);
export const updateComment  = (taskId, commentId, data) => api.put(`/tasks/${taskId}/comments/${commentId}`, data);
export const deleteComment  = (taskId, commentId)    => api.delete(`/tasks/${taskId}/comments/${commentId}`);
