import { useState, useEffect } from 'react';
import { getComments, addComment, updateComment, deleteComment } from '../api/comments';
import { useAuth } from '../context/AuthContext';
import { CommentsSkeleton } from './Skeleton';

const formatTime = (ts) =>
  new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const CommentSection = ({ taskId }) => {
  const { user } = useAuth();
  const [comments, setComments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [text, setText]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText]   = useState('');

  const fetchComments = () =>
    getComments(taskId)
      .then(({ data }) => setComments(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { fetchComments(); }, [taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await addComment(taskId, { comment: text.trim() });
      setText('');
      fetchComments();
    } catch {} finally { setSubmitting(false); }
  };

  const handleUpdate = async (commentId) => {
    if (!editText.trim()) return;
    try {
      await updateComment(taskId, commentId, { comment: editText.trim() });
      setEditingId(null);
      fetchComments();
    } catch {}
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(taskId, commentId);
      fetchComments();
    } catch {}
  };

  if (loading) return <CommentsSkeleton />;

  return (
    <div className="space-y-4">
      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="bg-gray-50 rounded-lg p-3">
              {editingId === c.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(c.id)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">{c.user_name}</span>
                    <span className="text-xs text-gray-400">{formatTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.comment}</p>
                  {c.user_id === user?.id && (
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => { setEditingId(c.id); setEditText(c.comment); }}
                        className="text-xs text-indigo-500 hover:underline"
                      >Edit</button>
                      <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:underline">Delete</button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* New comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Add a comment..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? '...' : 'Post'}
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
