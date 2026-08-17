const passwordChecks = [
  { label: "8 Chars", test: (value) => value.length >= 8 },
  { label: "A-Z", test: (value) => /[A-Z]/.test(value) },
  { label: "a-z", test: (value) => /[a-z]/.test(value) },
  { label: "123", test: (value) => /[0-9]/.test(value) },
  { label: "@#$", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export function getPasswordStrength(password) {
  const checks = passwordChecks.map((item) => ({ ...item, met: item.test(password) }));
  const score = checks.filter((item) => item.met).length;
  const tone = !password ? "empty" : score <= 2 ? "weak" : score <= 4 ? "medium" : "strong";
  const label = !password ? "Start typing" : tone === "weak" ? "Weak" : tone === "medium" ? "Medium" : "Strong";
  const level = !password ? 0 : tone === "weak" ? 1 : tone === "medium" ? 2 : 3;

  return { checks, label, level, score, tone };
}

export default function PasswordStrength({ password }) {
  const strength = getPasswordStrength(password);

  return (
    <div className={`password-meter password-meter--${strength.tone}`} aria-live="polite">
      <div className="password-meter-heading">
        <span>Password Strength</span>
        <strong>{strength.label}</strong>
      </div>
      <div
        aria-label={`Password strength: ${strength.label}`}
        aria-valuemax="3"
        aria-valuemin="0"
        aria-valuenow={strength.level}
        className="password-meter-track"
        role="progressbar"
      >
        <span className="password-meter-fill" style={{ "--password-level": strength.level }} />
      </div>
      <div className="password-requirements" aria-label="Password requirements">
        {strength.checks.map((check) => (
          <span className={check.met ? "is-met" : ""} key={check.label}>
            <i aria-hidden="true">{check.met ? "✓" : ""}</i>
            {check.label}
          </span>
        ))}
      </div>
    </div>
  );
}
