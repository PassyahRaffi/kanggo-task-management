import api from './axios';
export const getActivities = (taskId) => api.get(`/tasks/${taskId}/activities`);
