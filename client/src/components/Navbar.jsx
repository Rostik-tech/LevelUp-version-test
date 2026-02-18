import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isAuth, setIsAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuth(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuth(false);
    navigate("/login");
  };

  return (
    <nav style={{ padding: "15px", background: "#222", color: "white" }}>
      <Link style={{ color: "white", marginRight: "15px" }} to="/">
        Products
      </Link>

      {isAuth && (
        <Link style={{ color: "white", marginRight: "15px" }} to="/cart">
          Cart
        </Link>
      )}

      {!isAuth && (
        <>
          <Link style={{ color: "white", marginRight: "15px" }} to="/login">
            Login
          </Link>

          <Link style={{ color: "white" }} to="/register">
            Register
          </Link>
        </>
      )}

      {isAuth && (
        <button
          onClick={handleLogout}
          style={{
            marginLeft: "20px",
            padding: "5px 10px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      )}
    </nav>
  );
}