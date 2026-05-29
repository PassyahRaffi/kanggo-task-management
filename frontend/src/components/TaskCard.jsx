import { COPY } from '../constants/copy';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLES = {
  pending:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  'in-progress':'bg-blue-100 text-blue-700 border-blue-200',
  done:         'bg-green-100 text-green-700 border-green-200',
};
const STATUS_LABELS = {
  pending: COPY.tasks.statusPending,
  'in-progress': COPY.tasks.statusInProgress,
  done: COPY.tasks.statusDone,
};

const IMG_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const isImage  = (url) => url && IMG_EXTS.some((ext) => url.toLowerCase().endsWith(ext));

const TaskCard = ({ task, onView, onEdit, onDelete }) => {
  const { user } = useAuth();
  const canDelete = user?.role === 'admin' || task.user_id === user?.id || task.assigned_to_user_id === user?.id;
  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const formattedDeadline = deadlineDate
    ? deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isOverdue = deadlineDate && task.status !== 'done' && deadlineDate < today;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between gap-3 flex-1">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 break-words">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}
          {task.assignee_name && (
            <p className="text-xs text-indigo-500 mt-1.5">→ {task.assignee_name}</p>
          )}
          {formattedDeadline && (
            <p className={`text-xs mt-1.5 font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
              {isOverdue ? '⚠ Overdue: ' : 'Due: '}{formattedDeadline}
            </p>
          )}
          {task.attachment_url && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-1.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {isImage(task.attachment_url) ? 'Image' : 'Attachment'}
            </span>
          )}
        </div>
        <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[task.status]}`}>
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <button onClick={() => onView(task)}
          className="flex-1 text-sm text-gray-600 border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 transition-colors font-medium">
          View
        </button>
        <button onClick={() => onEdit(task)}
          className="flex-1 text-sm text-indigo-600 border border-indigo-200 rounded-lg py-1.5 hover:bg-indigo-50 transition-colors font-medium">
          Edit
        </button>
        {canDelete && (
          <button onClick={() => onDelete(task)}
            className="flex-1 text-sm text-red-500 border border-red-200 rounded-lg py-1.5 hover:bg-red-50 transition-colors font-medium">
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
