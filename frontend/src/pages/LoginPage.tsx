import { useState } from "react";
import { loginApi } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

const handleSubmit = async (
  e: React.FormEvent
) => {
  e.preventDefault();

  try {
    const data = await loginApi(
      email,
      password
    );

    console.log("API Response:", data);

    login(data.token, data.user);

    navigate("/dashboard");

  } catch (err: any) {
    console.error("Login Error:", err);

    alert(
      err?.response?.data?.message ||
      err?.message ||
      "Unknown Error"
    );
  }
};

  return (
  <div className="login-container">

    <div className="login-card">

      <div className="login-header">
        <h1>Deep Trace Cybernetics</h1>
        <p>
          Multi-Tenant Security Management Platform
        </p>
      </div>

      <form onSubmit={handleSubmit}>

        <div className="form-group">
          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />
        </div>

        <button
          type="submit"
          className="login-btn"
        >
          Sign In
        </button>

      </form>

      <div className="footer-text">
        Secure Access • JWT Authentication • RBAC
      </div>

    </div>

  </div>
);
};

export default LoginPage;