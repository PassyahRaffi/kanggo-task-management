const REQUIREMENTS = [
  { label: 'At least 8 characters',          test: (p) => p.length >= 8 },
  { label: 'One uppercase letter (A–Z)',      test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)',      test: (p) => /[a-z]/.test(p) },
  { label: 'One number (0–9)',                test: (p) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$…)',   test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const LEVELS = [
  { label: 'Very Weak', bar: 1, color: 'text-red-500',    bar_color: 'bg-red-400' },
  { label: 'Weak',      bar: 2, color: 'text-orange-500', bar_color: 'bg-orange-400' },
  { label: 'Fair',      bar: 3, color: 'text-yellow-500', bar_color: 'bg-yellow-400' },
  { label: 'Good',      bar: 4, color: 'text-blue-500',   bar_color: 'bg-blue-400' },
  { label: 'Strong',    bar: 5, color: 'text-green-600',  bar_color: 'bg-green-500' },
];

const CheckIcon = ({ met }) =>
  met ? (
    <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a9 9 0 100 18A9 9 0 0012 3z" />
    </svg>
  );

const PasswordStrength = ({ password }) => {
  if (!password) return null;

  const metCount = REQUIREMENTS.filter((r) => r.test(password)).length;
  const level = LEVELS[Math.max(0, metCount - 1)];

  return (
    <div className="mt-2.5 space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {LEVELS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < metCount ? level.bar_color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-semibold ${level.color}`}>{level.label}</p>

      {/* Requirements checklist */}
      <ul className="space-y-1.5">
        {REQUIREMENTS.map((req) => {
          const met = req.test(password);
          return (
            <li key={req.label} className="flex items-center gap-2">
              <CheckIcon met={met} />
              <span className={`text-xs transition-colors ${met ? 'text-gray-700' : 'text-gray-400'}`}>
                {req.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrength;
