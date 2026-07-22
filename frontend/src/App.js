import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { RoleProvider, useRole } from "@/lib/role";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import LiveAlertFeed from "@/components/LiveAlertFeed";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import CitizenChat from "@/pages/CitizenChat";
import OfficerTranscript from "@/pages/OfficerTranscript";
import OfficerCounterfeit from "@/pages/OfficerCounterfeit";
import OfficerBulkCounterfeit from "@/pages/OfficerBulkCounterfeit";
import AdminGraph from "@/pages/AdminGraph";
import AdminMap from "@/pages/AdminMap";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminAnalytics from "@/pages/AdminAnalytics";
import CasesTable from "@/pages/CasesTable";
import "@/App.css";

function Shell({ children }) {
  const { role } = useRole();
  const isDark = role === "officer" || role === "admin";
  return (
    <div className={`min-h-screen ${isDark ? "text-slate-100" : "text-slate-900"}`} style={{ backgroundColor: isDark ? "#0B1120" : "#F8FAFC" }}>
      <Navbar />
      <div className="grid-bg fixed inset-0 -z-10 opacity-40 pointer-events-none" style={{ display: isDark ? "block" : "none" }} />
      <main className="pt-20">{children}</main>
      {(role === "officer" || role === "admin") && <LiveAlertFeed />}
    </div>
  );
}

function Guard({ allow, children }) {
  const { role } = useRole();
  if (!role) return <Navigate to="/" replace />;
  if (allow && !allow.includes(role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <BrowserRouter>
          <Toaster richColors position="bottom-right" theme="dark" />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/citizen" element={<Shell><Guard allow={["citizen"]}><CitizenChat /></Guard></Shell>} />
            <Route path="/officer" element={<Shell><Guard allow={["officer", "admin"]}><AdminDashboard /></Guard></Shell>} />
            <Route path="/officer/transcript" element={<Shell><Guard allow={["officer", "admin"]}><OfficerTranscript /></Guard></Shell>} />
            <Route path="/officer/counterfeit" element={<Shell><Guard allow={["officer", "admin"]}><OfficerCounterfeit /></Guard></Shell>} />
            <Route path="/officer/bulk-counterfeit" element={<Shell><Guard allow={["officer", "admin"]}><OfficerBulkCounterfeit /></Guard></Shell>} />
            <Route path="/admin" element={<Shell><Guard allow={["admin", "officer"]}><AdminDashboard /></Guard></Shell>} />
            <Route path="/admin/graph" element={<Shell><Guard allow={["admin", "officer"]}><AdminGraph /></Guard></Shell>} />
            <Route path="/admin/map" element={<Shell><Guard allow={["admin", "officer"]}><AdminMap /></Guard></Shell>} />
            <Route path="/admin/analytics" element={<Shell><Guard allow={["admin", "officer"]}><AdminAnalytics /></Guard></Shell>} />
            <Route path="/cases" element={<Shell><Guard allow={["officer", "admin"]}><CasesTable /></Guard></Shell>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </RoleProvider>
    </AuthProvider>
  );
}
