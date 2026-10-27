import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { ToastProvider } from "./components";
import { AuthProvider, useAuth } from "./context";
import { ProductListPage } from "./pages/products/ProductListPage";
import { LoginPage } from "./pages/login/LoginPage";
import "./App.css";

function NavBar() {
  const { isAdmin, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/products");
  };

  return (
    <nav className="navbar">
      <NavLink to="/products" className="nav-brand">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        Product Catalog
      </NavLink>
      <span className="nav-caption">Hệ thống quản lý sản phẩm</span>

      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {isAdmin ? (
          <>
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--color-text-secondary, #4b5563)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontWeight: 500,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {currentUser || "admin"} (Admin)
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: "6px 14px",
                border: "1px solid var(--color-border, #d1d5db)",
                borderRadius: "var(--radius-sm, 6px)",
                background: "transparent",
                color: "var(--color-text, #374151)",
                fontSize: "0.8rem",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <NavLink
            to="/login"
            style={{
              padding: "6px 14px",
              border: "1px solid var(--color-primary, #3b82f6)",
              borderRadius: "var(--radius-sm, 6px)",
              background: "var(--color-primary, #3b82f6)",
              color: "#fff",
              fontSize: "0.8rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Đăng nhập Admin
          </NavLink>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <NavBar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/products" replace />} />
              <Route path="/products" element={<ProductListPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/products" replace />} />
            </Routes>
          </main>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
