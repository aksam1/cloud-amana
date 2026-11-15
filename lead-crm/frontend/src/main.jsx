import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import LeadsPage from "./pages/LeadsPage.jsx";
import LeadPage from "./pages/LeadPage.jsx";
import AutomationPage from "./pages/AutomationPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import "./styles.css";

function App() {
  return (
    <BrowserRouter>
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand">
            <span className="brand-mark">L</span> Lead CRM
          </NavLink>
          <nav>
            <NavLink to="/" end>Leads</NavLink>
            <NavLink to="/automation">Automation</NavLink>
            <NavLink to="/settings">Settings</NavLink>
          </nav>
        </div>
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<LeadsPage />} />
          <Route path="/leads/:id" element={<LeadPage />} />
          <Route path="/automation" element={<AutomationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<p className="empty">Page not found.</p>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
