import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as registerApi } from '../api/auth';
import { COPY } from '../constants/copy';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength from '../components/PasswordStrength';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = COPY.errors.nameRequired;
    if (!form.email.trim()) {
      errs.email = COPY.errors.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = COPY.errors.emailInvalid;
    }
    if (!form.password) {
      errs.password = COPY.errors.passwordRequired;
    } else if (form.password.length < 8) {
      errs.password = COPY.errors.passwordMinLength;
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setLoading(true);
    try {
      const { data } = await registerApi(form);
      login(data.data.token, data.data.user);
      navigate('/tasks');
    } catch (err) {
      const msg = err.response?.data?.message;
      setServerError(msg || COPY.errors.registerFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">TaskFlow</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your tasks efficiently</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">{COPY.auth.registerTitle}</h2>

          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {COPY.auth.nameLabel}
              </label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                autoComplete="off"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                  fieldErrors.name ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {COPY.auth.emailLabel}
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="off"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                  fieldErrors.email ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {COPY.auth.passwordLabel}
              </label>
              <PasswordInput
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                error={fieldErrors.password}
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
              )}
              <PasswordStrength password={form.password} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors mt-2"
            >
              {loading ? 'Creating account...' : COPY.auth.registerButton}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {COPY.auth.registerPrompt}{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              {COPY.auth.registerLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
