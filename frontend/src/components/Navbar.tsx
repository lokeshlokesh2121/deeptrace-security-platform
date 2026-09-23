import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { logout } = useAuth();

  return (
    <div>
      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
}