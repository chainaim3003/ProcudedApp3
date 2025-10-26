import { Button, Icon, Layout } from "@stellar/design-system";
import "./App.module.css";
import ConnectAccount from "./components/ConnectAccount.tsx";
import { Routes, Route, Outlet, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Debugger from "./pages/Debugger.tsx";
import Exporter from "./pages/Exporter.tsx";
import Importer from "./pages/Importer.tsx";
import Marketplace from "./pages/Marketplace.tsx";
import MarketplaceAdmin from "./pages/MarketplaceAdmin.tsx";

const AppLayout: React.FC = () => (
  <main>
    <Layout.Header
      projectId="My App"
      projectTitle="My App"
      contentRight={
        <>
          <nav style={{ display: "flex", gap: "0.5rem" }}>
            <NavLink
              to="/importer"
              style={{
                textDecoration: "none",
              }}
            >
              {({ isActive }) => (
                <Button
                  variant="tertiary"
                  size="md"
                  disabled={isActive}
                >
                  🏪 Buyer (Importer)
                </Button>
              )}
            </NavLink>
            <NavLink
              to="/exporter"
              style={{
                textDecoration: "none",
              }}
            >
              {({ isActive }) => (
                <Button
                  variant="tertiary"
                  size="md"
                  disabled={isActive}
                >
                  📦 Seller (Exporter)
                </Button>
              )}
            </NavLink>
            <NavLink
              to="/marketplace"
              style={{
                textDecoration: "none",
              }}
            >
              {({ isActive }) => (
                <Button
                  variant="tertiary"
                  size="md"
                  disabled={isActive}
                >
                  💰 Marketplace
                </Button>
              )}
            </NavLink>
            <NavLink
              to="/admin"
              style={{
                textDecoration: "none",
              }}
            >
              {({ isActive }) => (
                <Button
                  variant="tertiary"
                  size="md"
                  disabled={isActive}
                >
                  👥 Admin
                </Button>
              )}
            </NavLink>
            <NavLink
              to="/debug"
              style={{
                textDecoration: "none",
              }}
            >
              {({ isActive }) => (
                <Button
                  variant="tertiary"
                  size="md"
                  onClick={() => (window.location.href = "/debug")}
                  disabled={isActive}
                >
                  <Icon.Code02 size="md" />
                  Debugger
                </Button>
              )}
            </NavLink>
          </nav>
          <ConnectAccount />
        </>
      }
    />
    <Outlet />
    <Layout.Footer>
      <span>
        © {new Date().getFullYear()} My App. Licensed under the{" "}
        <a
          href="http://www.apache.org/licenses/LICENSE-2.0"
          target="_blank"
          rel="noopener noreferrer"
        >
          Apache License, Version 2.0
        </a>
        .
      </span>
    </Layout.Footer>
  </main>
);

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/importer" element={<Importer />} />
        <Route path="/exporter" element={<Exporter />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/admin" element={<MarketplaceAdmin />} />
        <Route path="/debug" element={<Debugger />} />
        <Route path="/debug/:contractName" element={<Debugger />} />
      </Route>
    </Routes>
  );
}

export default App;
