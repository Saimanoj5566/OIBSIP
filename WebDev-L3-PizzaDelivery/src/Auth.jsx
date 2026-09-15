import { useState } from "react";

function Auth({ onLoginSuccess }) {
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      let endpoint = "";

      if (mode === "register") {
        endpoint = "http://localhost:5000/api/auth/register";
      } else if (mode === "login") {
        endpoint = "http://localhost:5000/api/auth/login";
      } else {
        endpoint =
          "http://localhost:5000/api/auth/forgot-password";
      }

      const body =
        mode === "register"
          ? {
              name: form.name,
              email: form.email,
              password: form.password,
            }
          : mode === "login"
          ? {
              email: form.email,
              password: form.password,
            }
          : {
              email: form.email,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Something went wrong."
        );
      }

      setMessage(data.message);

      if (mode === "login") {
        localStorage.setItem(
          "pizzahubToken",
          data.token
        );

        localStorage.setItem(
          "pizzahubUser",
          JSON.stringify(data.user)
        );

        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      }

      if (mode === "register") {
        setForm({
          name: "",
          email: "",
          password: "",
        });
      }

      if (mode === "forgot") {
        setForm((current) => ({
          ...current,
          password: "",
        }));
      }
    } catch (err) {
      console.error("Authentication error:", err);

      setError(
        err.message ||
          "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setMessage("");
    setError("");

    setForm({
      name: "",
      email: "",
      password: "",
    });
  };

  return (
    <section className="auth-section">
      <div className="auth-card">

        <div className="auth-header">
          <div className="auth-logo">🍕</div>

          <h2>
            {mode === "login"
              ? "Welcome Back"
              : mode === "register"
              ? "Create Account"
              : "Forgot Password"}
          </h2>

          <p>
            {mode === "login"
              ? "Login to continue ordering delicious pizza."
              : mode === "register"
              ? "Create your PizzaHub account."
              : "Enter your email to receive a password reset link."}
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

          {mode === "register" && (
            <div className="auth-field">
              <label>Full Name</label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label>Email Address</label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          {mode !== "forgot" && (
            <div className="auth-field">
              <label>Password</label>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                minLength="6"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : mode === "register"
              ? "Create Account"
              : "Send Reset Link"}
          </button>
        </form>

        <div className="auth-links">

          {mode === "login" && (
            <>
              <button
                type="button"
                onClick={() => switchMode("forgot")}
              >
                Forgot Password?
              </button>

              <p>
                Don't have an account?
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                >
                  Create Account
                </button>
              </p>
            </>
          )}

          {mode === "register" && (
            <p>
              Already have an account?
              <button
                type="button"
                onClick={() => switchMode("login")}
              >
                Login
              </button>
            </p>
          )}

          {mode === "forgot" && (
            <p>
              Remember your password?
              <button
                type="button"
                onClick={() => switchMode("login")}
              >
                Back to Login
              </button>
            </p>
          )}

        </div>

      </div>
    </section>
  );
}

export default Auth;