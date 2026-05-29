const formatDuration = (ms) => {
  if (ms < 0) ms = 0;
  const totalMins = Math.floor(ms / 60000);
  if (totalMins < 1) return 'less than a minute';
  const days  = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins  = totalMins % 60;
  const parts = [];
  if (days  > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (mins  > 0 && days === 0) parts.push(`${mins} minute${mins !== 1 ? 's' : ''}`);
  return parts.join(' ') || 'less than a minute';
};

const computeTaskDurations = (task) => {
  const now = new Date();
  const createdAt   = task.created_at  ? new Date(task.created_at)  : null;
  const completedAt = task.completed_at ? new Date(task.completed_at) : null;

  return {
    completion_duration_label: completedAt && createdAt
      ? `Completed in ${formatDuration(completedAt - createdAt)}`
      : null,
    open_duration_label: !completedAt && createdAt
      ? `Open for ${formatDuration(now - createdAt)}`
      : null,
  };
};

module.exports = { formatDuration, computeTaskDurations };
