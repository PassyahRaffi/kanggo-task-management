import { useState, useEffect } from 'react';
import { getDashboardSummary } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';

const Card = ({ label, value, color = 'text-gray-800', bg = 'bg-white' }) => (
  <div className={`${bg} border border-gray-200 rounded-xl p-4 shadow-sm`}>
    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
  </div>
);

const DashboardCards = () => {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-xs text-gray-400 py-4">Loading summary...</div>;
  if (!data)   return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
      <Card label="Total Tasks"  value={data.total} />
      <Card label="Pending"      value={data.pending}     color="text-yellow-600" />
      <Card label="In Progress"  value={data.in_progress} color="text-blue-600"   />
      <Card label="Done"         value={data.done}        color="text-green-600"  />
      <Card label="Overdue"      value={data.overdue}     color="text-red-600"    />
      {data.assigned_to_me != null && <Card label="Assigned to Me" value={data.assigned_to_me} color="text-purple-600" />}
      {data.created_by_me  != null && <Card label="Created by Me"  value={data.created_by_me}  />}
      {data.total_users    != null && <Card label="Total Users"     value={data.total_users}    />}
      {data.total_divisions != null && <Card label="Divisions"      value={data.total_divisions}/>}
    </div>
  );
};

export default DashboardCards;
