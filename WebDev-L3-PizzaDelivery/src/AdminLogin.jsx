import { useState } from "react";

function AdminLogin({ onAdminLoginSuccess }) {
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  // =========================================================
  // ADMIN LOGIN
  // =========================================================

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Invalid email or password."
        );
      }

      if (data.user?.role !== "admin") {
        throw new Error(
          "Access denied. Admin account required."
        );
      }

      localStorage.setItem(
        "pizzahubToken",
        data.token
      );

      localStorage.setItem(
        "pizzahubUser",
        JSON.stringify(data.user)
      );

      if (onAdminLoginSuccess) {
        onAdminLoginSuccess(data.user);
      }
    } catch (err) {
      console.error(
        "Admin login error:",
        err
      );

      setError(
        err.message ||
          "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(
        "Please enter your admin email address."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to send password reset email."
        );
      }

      setMessage(
        "If an account exists with this email, a password reset link has been sent."
      );

      setPassword("");
    } catch (err) {
      console.error(
        "Admin forgot password error:",
        err
      );

      setError(
        err.message ||
          "Unable to send password reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOGIN MODE
  // =========================================================

  if (mode === "login") {
    return (
      <section className="admin-login-section">
        <div className="admin-login-card">

          <div className="admin-login-icon">
            🔐
          </div>

          <div className="admin-login-header">

            <span className="admin-badge">
              PIZZAHUB ADMIN
            </span>

            <h1>Admin Portal</h1>

            <p>
              Sign in to manage orders and inventory.
            </p>

          </div>

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}

          {message && (
            <div className="admin-login-success">
              {message}
            </div>
          )}

          <form onSubmit={handleLogin}>

            <div className="admin-login-field">

              <label>
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter admin email"
                required
              />

            </div>

            <div className="admin-login-field">

              <label>
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                required
              />

            </div>

            <div className="admin-forgot-wrapper">

              <button
                type="button"
                className="admin-forgot-button"
                onClick={() => {
                  setMode("forgot");
                  setError("");
                  setMessage("");
                }}
              >
                Forgot Password?
              </button>

            </div>

            <button
              type="submit"
              className="admin-login-button"
              disabled={loading}
            >
              {loading
                ? "Authenticating..."
                : "Login to Admin Panel"}
            </button>

          </form>

          <div className="admin-login-footer">

            <span>🍕</span>

            <span>
              Authorized PizzaHub personnel only
            </span>

          </div>

        </div>
      </section>
    );
  }

  // =========================================================
  // FORGOT PASSWORD MODE
  // =========================================================

  return (
    <section className="admin-login-section">
      <div className="admin-login-card">

        <div className="admin-login-icon">
          🔑
        </div>

        <div className="admin-login-header">

          <span className="admin-badge">
            PIZZAHUB ADMIN
          </span>

          <h1>Reset Password</h1>

          <p>
            Enter your admin email and we'll send
            you a secure password reset link.
          </p>

        </div>

        {error && (
          <div className="admin-login-error">
            {error}
          </div>
        )}

        {message && (
          <div className="admin-login-success">
            {message}
          </div>
        )}

        <form onSubmit={handleForgotPassword}>

          <div className="admin-login-field">

            <label>
              Admin Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your admin email"
              required
            />

          </div>

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading
              ? "Sending Reset Link..."
              : "Send Reset Link"}
          </button>

        </form>

        <div className="admin-back-login">

          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
          >
            ← Back to Admin Login
          </button>

        </div>

        <div className="admin-login-footer">

          <span>🍕</span>

          <span>
            Authorized PizzaHub personnel only
          </span>

        </div>

      </div>
    </section>
  );
}

export default AdminLogin;