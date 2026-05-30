import ActivityTimeline from './ActivityTimeline';
import CommentSection from './CommentSection';

const STATUS_STYLES = {
  pending:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  'in-progress':'bg-blue-100 text-blue-700 border-blue-200',
  done:         'bg-green-100 text-green-700 border-green-200',
};

const STATUS_LABELS = { pending: 'Pending', 'in-progress': 'In Progress', done: 'Done' };

const fmt = (ts, includeTime = false) => {
  if (!ts) return '—';
  const opts = { year: 'numeric', month: 'short', day: 'numeric' };
  if (includeTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit' });
  return new Date(ts).toLocaleDateString('en-US', opts);
};

const IMG_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const isImage  = (url) => url && IMG_EXTS.some((ext) => url.toLowerCase().endsWith(ext));

const TaskDetailModal = ({ task, onClose, onEdit }) => (
  <div
    className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-6">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-gray-800 break-words">{task.title}</h2>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${STATUS_STYLES[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
          </div>
          {task.division_name && (
            <p className="text-xs text-gray-400 mt-1">{task.division_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <button
            onClick={onEdit}
            className="text-sm text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Edit
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {task.description && (
            <div className="col-span-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
              <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Created by</p>
            <p className="text-gray-700">{task.creator_name || '—'}</p>
          </div>

          {task.assignee_name && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Assigned to</p>
              <p className="text-gray-700">{task.assignee_name}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Created</p>
            <p className="text-gray-700">{fmt(task.created_at, true)}</p>
          </div>

          {task.deadline && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Deadline</p>
              <p className={`font-medium ${new Date(task.deadline) < new Date() && task.status !== 'done' ? 'text-red-500' : 'text-gray-700'}`}>
                {fmt(task.deadline)}
              </p>
            </div>
          )}

          {task.completed_at && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Completed</p>
              <p className="text-gray-700">{fmt(task.completed_at, true)}</p>
            </div>
          )}

          {task.deadline && task.completed_at && (() => {
            const d1 = new Date(task.completed_at); d1.setHours(0,0,0,0);
            const d2 = new Date(task.deadline);      d2.setHours(0,0,0,0);
            const diff = Math.round((d2 - d1) / 86400000);
            if (diff > 0) return (
              <div className="flex items-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
                  ✓ Completed {diff} day{diff !== 1 ? 's' : ''} early
                </span>
              </div>
            );
            if (diff < 0) return (
              <div className="flex items-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full">
                  ⚠ Completed {-diff} day{-diff !== 1 ? 's' : ''} late
                </span>
              </div>
            );
            return (
              <div className="flex items-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                  ✓ Completed on time
                </span>
              </div>
            );
          })()}

        </div>

        {/* Attachment */}
        {task.attachment_url && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Attachment</p>
            {isImage(task.attachment_url) && (
              <img
                src={task.attachment_url}
                alt="Attachment preview"
                className="max-h-40 rounded-lg border border-gray-200 mb-2 object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <a
              href={task.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Attachment
            </a>
          </div>
        )}

        {/* Comments */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Comments</h3>
          <CommentSection taskId={task.id} />
        </div>

        {/* Timeline */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Activity Timeline</h3>
          <ActivityTimeline taskId={task.id} />
        </div>
      </div>
    </div>
  </div>
);

export default TaskDetailModal;
