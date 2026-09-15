import { useState } from "react";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getToken = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!password || !confirmPassword) {
      setError("Please enter both password fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Invalid or missing password reset link.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to reset password."
        );
      }

      setMessage(
        "Password reset successfully! You can now log in."
      );

      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Reset password error:", err);

      setError(
        err.message || "Unable to reset your password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-card">

        <div className="auth-header">
          <div className="auth-logo">🔐</div>

          <h2>Reset Password</h2>

          <p>
            Create a new password for your PizzaHub account.
          </p>
        </div>

        {message && (
          <div className="auth-message success">
            {message}
          </div>
        )}

        {error && (
          <div className="auth-message error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="auth-field">
            <label>New Password</label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter new password"
              minLength="6"
              required
            />
          </div>

          <div className="auth-field">
            <label>Confirm Password</label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm new password"
              minLength="6"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Resetting..."
              : "Reset Password"}
          </button>

        </form>

        <div className="auth-links">
          <p>
            Remember your password?

            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Back to PizzaHub
            </button>
          </p>
        </div>

      </div>
    </section>
  );
}

export default ResetPassword;