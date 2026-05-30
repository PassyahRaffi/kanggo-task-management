import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KanbanSkeleton } from '../components/Skeleton';
import Navbar from '../components/Navbar';
import TaskModal from '../components/TaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import ConfirmModal from '../components/ConfirmModal';
import KanbanBoard from '../components/KanbanBoard';
import { getTasks, createTask, updateTask, deleteTask, reorderTasks } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import { COPY } from '../constants/copy';

const PAGE_LIMIT = 9;

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending',     label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done',        label: 'Done' },
];

const formatTotal = (n) => {
  if (n >= 1000) return `${Math.floor(n / 1000)},000+`;
  return String(n);
};

const TasksPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'admin';

  const [searchParams, setSearchParams] = useSearchParams();

  const [filter,         setFilter]         = useState(searchParams.get('status')   || '');
  const [deadlineFilter, setDeadlineFilter] = useState(searchParams.get('deadline') || '');
  const [assignedFilter, setAssignedFilter] = useState(searchParams.get('assigned') || '');
  const [searchInput,    setSearchInput]    = useState(searchParams.get('search')   || '');
  const [activeSearch,   setActiveSearch]   = useState(searchParams.get('search')   || '');
  const [currentPage,    setCurrentPage]    = useState(Math.max(1, parseInt(searchParams.get('page') || '1', 10)));

  const [tasks,       setTasks]      = useState([]);
  const [loadingTasks, setLoading]  = useState(true);
  const [fetchError,   setFetchError] = useState('');
  const [pagination,   setPagination] = useState(null);
  const hasLoaded = useRef(false); // track initial load to avoid skeleton on re-fetches

  const [showTaskModal, setShowTaskModal]     = useState(false);
  const [editingTask,   setEditingTask]       = useState(null);
  const [taskSaving,    setTaskSaving]        = useState(false);
  const [taskSaveError, setTaskSaveError]     = useState('');

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingTask,     setViewingTask]     = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTask,    setDeletingTask]    = useState(null);
  const [deleteLoading,   setDeleteLoading]  = useState(false);

  const [toast, setToast] = useState('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Sync state → URL
  useEffect(() => {
    const p = {};
    if (filter)         p.status   = filter;
    if (deadlineFilter) p.deadline = deadlineFilter;
    if (assignedFilter) p.assigned = assignedFilter;
    if (activeSearch)   p.search   = activeSearch;
    if (currentPage > 1) p.page   = String(currentPage);
    setSearchParams(p, { replace: true });
  }, [filter, deadlineFilter, assignedFilter, activeSearch, currentPage, setSearchParams]);

  // Reset page when any filter/search changes
  useEffect(() => { setCurrentPage(1); }, [filter, deadlineFilter, assignedFilter, activeSearch]);

  const fetchTasks = useCallback(async () => {
    setLoading(true); setFetchError('');
    try {
      const params = { page: currentPage, limit: PAGE_LIMIT };
      if (filter)         params.status   = filter;
      if (deadlineFilter) params.deadline = deadlineFilter;
      if (assignedFilter) params.assigned = assignedFilter;
      if (activeSearch.trim()) params.search = activeSearch.trim();

      const { data } = await getTasks(params);
      if (data.data?.tasks) {
        setTasks(data.data.tasks);
        setPagination(data.data.pagination);
      } else {
        setTasks(data.data);
        setPagination(null);
      }
    } catch { setFetchError(COPY.errors.tasksFailed); }
    finally  { setLoading(false); hasLoaded.current = true; }
  }, [filter, deadlineFilter, assignedFilter, activeSearch, currentPage]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleSearchSubmit = (e) => { e.preventDefault(); setActiveSearch(searchInput); };
  const handleClearSearch  = () => { setSearchInput(''); setActiveSearch(''); };
  const clearAllFilters    = () => {
    setFilter(''); setDeadlineFilter(''); setAssignedFilter('');
    setSearchInput(''); setActiveSearch('');
  };
  const hasActiveFilters = filter || deadlineFilter || assignedFilter || activeSearch;

  const openAdd    = () => { setEditingTask(null); setTaskSaveError(''); setShowTaskModal(true); };
  const openEdit   = (task) => { setEditingTask(task); setTaskSaveError(''); setShowTaskModal(true); };
  const openView   = (task) => { setViewingTask(task); setShowDetailModal(true); };
  const openDelete = (task) => { setDeletingTask(task); setShowDeleteModal(true); };

  const handleSaveTask = async (formData) => {
    setTaskSaving(true); setTaskSaveError('');
    try {
      if (editingTask) { await updateTask(editingTask.id, formData); showToast(COPY.success.taskUpdated); }
      else             { await createTask(formData);                  showToast(COPY.success.taskCreated); }
      setShowTaskModal(false); fetchTasks();
    } catch (err) {
      setTaskSaveError(err.response?.data?.message || COPY.errors.taskSaveFailed);
    } finally { setTaskSaving(false); }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await deleteTask(deletingTask.id);
      showToast(COPY.success.taskDeleted);
      setShowDeleteModal(false); setDeletingTask(null); fetchTasks();
    } catch (err) {
      setShowDeleteModal(false);
      showToast(err.response?.data?.message || COPY.errors.taskDeleteFailed);
    } finally { setDeleteLoading(false); }
  };

  const handleReorder = async (orders) => {
    setTasks((prev) => {
      const orderMap = Object.fromEntries(orders.map((o) => [o.id, o.sort_order]));
      return prev.map((t) => orderMap[t.id] !== undefined ? { ...t, sort_order: orderMap[t.id] } : t);
    });
    try { await reorderTasks(orders); } catch { /* silent — order resets on next fetch */ }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const prev = tasks.find((t) => t.id === taskId);
    setTasks((ts) => ts.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await updateTask(taskId, { status: newStatus });
      await fetchTasks();
    } catch (err) {
      setTasks((ts) => ts.map((t) => t.id === taskId ? prev : t));
      showToast(err.response?.data?.message || 'Failed to update task status.');
    }
  };

  // Pagination range display
  const paginationInfo = pagination ? (() => {
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end   = Math.min(pagination.page * pagination.limit, pagination.total);
    return `${start}–${end} of ${formatTotal(pagination.total)}`;
  })() : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-800">{COPY.tasks.pageTitle}</h1>
          {canManage && (
            <button onClick={openAdd}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
              <span className="text-base leading-none">+</span> {COPY.tasks.addTask}
            </button>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-3">
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors">Search</button>
          {activeSearch && (
            <button type="button" onClick={handleClearSearch} className="text-gray-500 border border-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Clear</button>
          )}
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {/* Status */}
          <div className="flex gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === opt.value ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                {opt.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-gray-200" />

          {/* Deadline */}
          <select value={deadlineFilter} onChange={(e) => setDeadlineFilter(e.target.value)}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white transition-colors ${deadlineFilter ? 'border-indigo-400 text-indigo-700' : 'border-gray-300 text-gray-600'}`}>
            <option value="">Any Deadline</option>
            <option value="overdue">Overdue</option>
            <option value="this_week">Due This Week</option>
            <option value="no_deadline">No Deadline</option>
          </select>

          {/* Assigned */}
          <select value={assignedFilter} onChange={(e) => setAssignedFilter(e.target.value)}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white transition-colors ${assignedFilter ? 'border-indigo-400 text-indigo-700' : 'border-gray-300 text-gray-600'}`}>
            <option value="">Any Assignment</option>
            <option value="assigned">Has Assignee</option>
            <option value="unassigned">Unassigned</option>
            <option value="me">Assigned to Me</option>
          </select>

          {hasActiveFilters && (
            <button onClick={clearAllFilters}
              className="px-3 py-1.5 rounded-lg text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-colors">
              Clear All
            </button>
          )}

          {paginationInfo && (
            <span className="ml-auto text-xs text-gray-400 font-medium whitespace-nowrap">{paginationInfo}</span>
          )}
        </div>

        {/* Content */}
        {loadingTasks && !hasLoaded.current ? (
          <KanbanSkeleton />
        ) : fetchError ? (
          <div className="text-center py-16">
            <p className="text-red-500 text-sm mb-3">{fetchError}</p>
            <button onClick={fetchTasks} className="text-indigo-600 text-sm hover:underline">Try again</button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">{COPY.tasks.noTasks}</div>
        ) : (
          <>
            <KanbanBoard tasks={tasks} onView={openView} onEdit={openEdit} onDelete={openDelete} onStatusChange={handleStatusChange} onReorder={handleReorder} />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-8">
                <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  ← Prev
                </button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pg) => (
                  <button key={pg} onClick={() => setCurrentPage(pg)}
                    className={`w-8 h-8 text-sm rounded-lg border transition-colors ${pg === currentPage ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                    {pg}
                  </button>
                ))}

                <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Next →
                </button>

              </div>
            )}
          </>
        )}
      </main>

      {showTaskModal && (
        <TaskModal task={editingTask} onSave={handleSaveTask} onClose={() => setShowTaskModal(false)}
          loading={taskSaving} serverError={taskSaveError} />
      )}
      {showDetailModal && viewingTask && (
        <TaskDetailModal task={viewingTask} onClose={() => setShowDetailModal(false)}
          onEdit={() => { setShowDetailModal(false); openEdit(viewingTask); }} />
      )}
      {showDeleteModal && (
        <ConfirmModal title={COPY.tasks.deleteConfirmTitle}
          message={`${COPY.tasks.deleteConfirm} "${deletingTask?.title}"?`}
          onConfirm={handleDeleteConfirm}
          onClose={() => !deleteLoading && setShowDeleteModal(false)}
          loading={deleteLoading} />
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-xl shadow-lg">{toast}</div>
      )}
    </div>
  );
};

export default TasksPage;
