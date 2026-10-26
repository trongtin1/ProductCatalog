import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
} from "react-router-dom";
import { ToastProvider } from "./components";
import { ProductListPage } from "./pages/products/ProductListPage";
import "./App.css";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
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
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
