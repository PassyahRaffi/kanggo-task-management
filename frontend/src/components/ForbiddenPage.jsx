import { Link } from 'react-router-dom';

const ForbiddenPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center">
      <p className="text-7xl font-bold text-gray-200 mb-4">403</p>
      <h1 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h1>
      <p className="text-sm text-gray-500 mb-6">
        You do not have permission to access this page.
      </p>
      <Link to="/tasks" className="text-indigo-600 text-sm font-medium hover:underline">
        ← Back to Tasks
      </Link>
    </div>
  </div>
);

export default ForbiddenPage;
