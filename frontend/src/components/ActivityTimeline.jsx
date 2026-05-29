import { useState, useEffect } from 'react';
import { getActivities } from '../api/activities';
import { ActivitySkeleton } from './Skeleton';

const ACTION_ICONS = {
  task_created:   { icon: '✦', color: 'bg-indigo-100 text-indigo-600' },
  task_updated:   { icon: '✎', color: 'bg-blue-100 text-blue-600' },
  status_changed: { icon: '↻', color: 'bg-yellow-100 text-yellow-600' },
  task_assigned:  { icon: '→', color: 'bg-purple-100 text-purple-600' },
  comment_added:  { icon: '💬', color: 'bg-gray-100 text-gray-600' },
  task_completed: { icon: '✓', color: 'bg-green-100 text-green-600' },
  default:        { icon: '•', color: 'bg-gray-100 text-gray-500' },
};

const ACTION_LABELS = {
  task_created:   (a) => `Task created`,
  task_updated:   (a) => `Task updated`,
  status_changed: (a) => `Status changed from "${a.old_value}" → "${a.new_value}"`,
  task_assigned:  (a) => a.new_value ? `Assigned to ${a.new_value}` : 'Assignment removed',
  comment_added:  (a) => `Comment added`,
  task_completed: (a) => `Task marked as done`,
};

const formatTime = (ts) =>
  new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const ActivityTimeline = ({ taskId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    getActivities(taskId)
      .then(({ data }) => setActivities(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <ActivitySkeleton />;
  if (!activities.length) return <p className="text-xs text-gray-400 py-4 text-center">No activity yet.</p>;

  return (
    <ol className="relative border-l border-gray-200 ml-3 space-y-4">
      {activities.map((a) => {
        const { icon, color } = ACTION_ICONS[a.action] || ACTION_ICONS.default;
        const label = (ACTION_LABELS[a.action] || (() => a.action))(a);
        return (
          <li key={a.id} className="ml-5">
            <span className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${color}`}>
              {icon}
            </span>
            <div className="flex flex-col">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{a.actor_name}</span>
                {' — '}{label}
              </p>
              <time className="text-xs text-gray-400">{formatTime(a.created_at)}</time>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default ActivityTimeline;
