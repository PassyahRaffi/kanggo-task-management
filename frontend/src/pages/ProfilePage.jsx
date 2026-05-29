import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength from '../components/PasswordStrength';
import { getMe, updateMe, updatePassword } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { ProfileSkeleton } from '../components/Skeleton';

const ROLE_LABELS = { admin: 'Admin', user: 'User' };
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const ProfilePage = () => {
  const { user, login } = useAuth();
  const navigate        = useNavigate();

  // Pre-fill from AuthContext immediately, then sync from API
  const [profile, setProfile]             = useState({
    name:  user?.name  || '',
    email: user?.email || '',
    role:  user?.role  || '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]       = useState('');
  const [loading, setLoading]             = useState(!user?.name);

  const [pwd, setPwd]             = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg]       = useState('');

  useEffect(() => {
    getMe()
      .then(({ data }) => setProfile({
        name:  data.data.name  || '',
        email: data.data.email || '',
        role:  data.data.role  || '',
      }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleProfileChange = (e) => {
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));
    setProfileErrors((p) => ({ ...p, [e.target.name]: '' }));
    setProfileMsg('');
  };

  const handlePwdChange = (e) => {
    const { name, value } = e.target;
    setPwd((p) => {
      const next = { ...p, [name]: value };
      // Real-time confirm match check
      if (name === 'confirm_password' || (name === 'new_password' && p.confirm_password)) {
        const match = name === 'confirm_password' ? value === next.new_password : next.confirm_password === value;
        setPwdErrors((err) => ({
          ...err,
          confirm_password: next.confirm_password && !match ? 'Passwords do not match' : '',
        }));
      } else {
        setPwdErrors((err) => ({ ...err, [name]: '' }));
      }
      return next;
    });
    setPwdMsg('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!profile.name.trim()) errs.name = 'Name is required';
    if (!profile.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email))
      errs.email = 'Valid email is required';
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }

    setProfileSaving(true);
    try {
      const { data } = await updateMe({ name: profile.name, email: profile.email });
      setProfileMsg('Profile updated successfully.');
      const token = localStorage.getItem('token');
      if (token) login(token, { ...data.data, role: profile.role });
    } catch (err) {
      setProfileMsg('');
      setProfileErrors({ server: err.response?.data?.message || 'Update failed.' });
    } finally { setProfileSaving(false); }
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwd.new_password)             errs.new_password      = 'New password is required';
    else if (!PASSWORD_RE.test(pwd.new_password))
                                       errs.new_password      = 'Must be 8+ chars with uppercase, lowercase, number, and special character';
    if (!pwd.confirm_password)         errs.confirm_password  = 'Please confirm your new password';
    else if (pwd.new_password !== pwd.confirm_password)
                                       errs.confirm_password  = 'Passwords do not match';
    if (Object.keys(errs).length) { setPwdErrors(errs); return; }

    setPwdSaving(true);
    try {
      await updatePassword({ current_password: pwd.current_password, new_password: pwd.new_password });
      setPwdMsg('Password updated successfully.');
      setPwd({ current_password: '', new_password: '', confirm_password: '' });
      setPwdErrors({});
    } catch (err) {
      setPwdMsg('');
      setPwdErrors({ server: err.response?.data?.message || 'Password update failed.' });
    } finally { setPwdSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-5" />
          <ProfileSkeleton />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-5" />
          <ProfileSkeleton />
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <button onClick={() => navigate('/tasks')} className="text-sm text-indigo-600 hover:underline">← Back to Tasks</button>

        {/* Profile Info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Profile</h2>

          {profileErrors.server && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-600">{profileErrors.server}</div>
          )}
          {profileMsg && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-600">{profileMsg}</div>
          )}

          <form onSubmit={handleProfileSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input name="name" value={profile.name} onChange={handleProfileChange} autoComplete="off"
                placeholder="Your name"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${profileErrors.name ? 'border-red-400' : 'border-gray-300'}`} />
              {profileErrors.name && <p className="text-xs text-red-500 mt-1">{profileErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" value={profile.email} disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input value={ROLE_LABELS[profile.role] || profile.role} disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">Role is managed by your administrator.</p>
            </div>

            <button type="submit" disabled={profileSaving}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Change Password</h2>

          {pwdErrors.server && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-600">{pwdErrors.server}</div>
          )}
          {pwdMsg && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-600">{pwdMsg}</div>
          )}

          <form onSubmit={handlePwdSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <PasswordInput name="current_password" value={pwd.current_password} onChange={handlePwdChange}
                placeholder="Enter current password" autoComplete="off" />
              {pwdErrors.current_password && <p className="text-xs text-red-500 mt-1">{pwdErrors.current_password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <PasswordInput name="new_password" value={pwd.new_password} onChange={handlePwdChange}
                placeholder="At least 8 characters" autoComplete="off" />
              {pwdErrors.new_password && <p className="text-xs text-red-500 mt-1">{pwdErrors.new_password}</p>}
              <PasswordStrength password={pwd.new_password} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <PasswordInput name="confirm_password" value={pwd.confirm_password} onChange={handlePwdChange}
                placeholder="Repeat new password" autoComplete="off" />
              {pwdErrors.confirm_password && (
                <p className="text-xs text-red-500 mt-1">{pwdErrors.confirm_password}</p>
              )}
              {pwd.confirm_password && pwd.new_password === pwd.confirm_password && !pwdErrors.confirm_password && (
                <p className="text-xs text-green-500 mt-1">Passwords match ✓</p>
              )}
            </div>

            <button type="submit" disabled={pwdSaving}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {pwdSaving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
