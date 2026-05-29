import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';
import { getDivisions, createDivision, updateDivision, deleteDivision } from '../api/divisions';

// ── Inline modal (division-specific, not worth a separate file) ──
const DivisionModal = ({ division, onSave, onClose, loading, serverError }) => {
  const [form, setForm] = useState({
    name:        division?.name        || '',
    description: division?.description || '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim())             errs.name = 'Division name is required.';
    else if (form.name.trim().length < 2) errs.name = 'Division name must be at least 2 characters.';
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
    onSave({ name: form.name.trim(), description: form.description.trim() || null });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {division ? 'Edit Division' : 'Add Division'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Engineering"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                fieldErrors.name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Optional description"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Division'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────
const DivisionsPage = () => {
  const [divisions, setDivisions]     = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError]     = useState('');

  const [showModal, setShowModal]         = useState(false);
  const [editingDivision, setEditingDivision] = useState(null);
  const [modalLoading, setModalLoading]   = useState(false);
  const [modalError, setModalError]       = useState('');

  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [deletingDivision, setDeletingDivision] = useState(null);
  const [deleteLoading, setDeleteLoading]       = useState(false);

  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchDivisions = useCallback(async () => {
    setPageLoading(true);
    setPageError('');
    try {
      const { data } = await getDivisions();
      setDivisions(data.data);
    } catch {
      setPageError('Failed to load divisions. Please try again.');
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { fetchDivisions(); }, [fetchDivisions]);

  const openAdd = () => {
    setEditingDivision(null);
    setModalError('');
    setShowModal(true);
  };

  const openEdit = (div) => {
    setEditingDivision(div);
    setModalError('');
    setShowModal(true);
  };

  const openDelete = (div) => {
    setDeletingDivision(div);
    setShowDeleteModal(true);
  };

  const handleSave = async (formData) => {
    setModalLoading(true);
    setModalError('');
    try {
      if (editingDivision) {
        await updateDivision(editingDivision.id, formData);
        showToast('Division updated successfully.');
      } else {
        await createDivision(formData);
        showToast('Division created successfully.');
      }
      setShowModal(false);
      fetchDivisions();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save division.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await deleteDivision(deletingDivision.id);
      showToast('Division deleted successfully.');
      setShowDeleteModal(false);
      setDeletingDivision(null);
      fetchDivisions();
    } catch (err) {
      setShowDeleteModal(false);
      showToast(err.response?.data?.message || 'Failed to delete division.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Divisions</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage organization divisions</p>
          </div>
          <button
            onClick={openAdd}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span> Add Division
          </button>
        </div>

        {/* Content */}
        {pageLoading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading divisions...</div>
        ) : pageError ? (
          <div className="text-center py-16">
            <p className="text-red-500 text-sm mb-3">{pageError}</p>
            <button onClick={fetchDivisions} className="text-indigo-600 text-sm hover:underline">Try again</button>
          </div>
        ) : divisions.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No divisions yet. Create the first one!
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Name</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600 hidden md:table-cell">Description</th>
                  <th className="px-5 py-3.5 text-center font-semibold text-gray-600">Users</th>
                  <th className="px-5 py-3.5 text-center font-semibold text-gray-600">Tasks</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {divisions.map((div) => (
                  <tr key={div.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-800">{div.name}</td>
                    <td className="px-5 py-4 text-gray-500 hidden md:table-cell max-w-xs">
                      <span className="line-clamp-1">{div.description || '—'}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] h-6 px-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                        {div.user_count}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] h-6 px-2 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full">
                        {div.task_count}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(div)}
                          className="text-xs text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(div)}
                          className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modals */}
      {showModal && (
        <DivisionModal
          division={editingDivision}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          loading={modalLoading}
          serverError={modalError}
        />
      )}

      {showDeleteModal && (
        <ConfirmModal
          title="Delete Division"
          message={`Are you sure you want to delete "${deletingDivision?.name}"? This cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onClose={() => !deleteLoading && setShowDeleteModal(false)}
          loading={deleteLoading}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
};

export default DivisionsPage;
