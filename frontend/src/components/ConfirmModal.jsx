import { COPY } from '../constants/copy';

const ConfirmModal = ({ title, message, onConfirm, onClose, loading }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
  >
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
      <div className="px-6 py-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          {title || COPY.tasks.deleteConfirmTitle}
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">{message || COPY.tasks.deleteConfirm}</p>
      </div>
      <div className="px-6 pb-5 flex gap-3">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Deleting...' : COPY.tasks.deleteButton}
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {COPY.tasks.cancelButton}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
