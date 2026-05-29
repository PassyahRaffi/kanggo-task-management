import { useState, useEffect } from 'react';
import { COPY } from '../constants/copy';
import { getUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'pending',     label: COPY.tasks.statusPending },
  { value: 'in-progress', label: COPY.tasks.statusInProgress },
  { value: 'done',        label: COPY.tasks.statusDone },
];

const TaskModal = ({ task, onSave, onClose, loading, serverError }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title:               task?.title               || '',
    description:         task?.description         || '',
    status:              task?.status              || 'pending',
    deadline:            task?.deadline ? task.deadline.split('T')[0] : '',
    assigned_to_user_id: task?.assigned_to_user_id || '',
    attachment_url:      task?.attachment_url      || '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      getUsers()
        .then(({ data }) => setUsers(data.data.filter((u) => u.role === 'user')))
        .catch(() => {});
    }
  }, [user?.role]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = COPY.errors.titleRequired;
    if (form.attachment_url && !/^https?:\/\/.+/.test(form.attachment_url)) {
      errs.attachment_url = 'Only valid URLs are allowed.';
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    onSave({
      title:               form.title.trim(),
      description:         form.description.trim() || null,
      status:              form.status,
      deadline:            form.deadline || null,
      assigned_to_user_id: form.assigned_to_user_id ? Number(form.assigned_to_user_id) : null,
      attachment_url:      form.attachment_url.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-800">
            {task ? COPY.tasks.editTask : COPY.tasks.addTask}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{serverError}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {COPY.tasks.titleLabel} <span className="text-red-500">*</span>
            </label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Enter task title"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${fieldErrors.title ? 'border-red-400' : 'border-gray-300'}`} />
            {fieldErrors.title && <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{COPY.tasks.descriptionLabel}</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              placeholder="Optional description"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{COPY.tasks.statusLabel}</label>
              <select name="status" value={form.status} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{COPY.tasks.deadlineLabel}</label>
              <input type="date" name="deadline" value={form.deadline} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>

          {/* Assign to — shown for admin/super_admin */}
          {users.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select name="assigned_to_user_id" value={form.assigned_to_user_id} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                <option value="">— Unassigned —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachment URL</label>
            <input name="attachment_url" value={form.attachment_url} onChange={handleChange}
              placeholder="https://example.com/file.pdf"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${fieldErrors.attachment_url ? 'border-red-400' : 'border-gray-300'}`} />
            {fieldErrors.attachment_url && <p className="text-xs text-red-500 mt-1">{fieldErrors.attachment_url}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {loading ? 'Saving...' : COPY.tasks.saveButton}
            </button>
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              {COPY.tasks.cancelButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
