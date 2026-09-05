import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import Listings from "./pages/Listings";
import PropertyDetails from "./pages/PropertyDetails";
import AdminDashboard from "./pages/AdminDashboard";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import CompareProperties from "./pages/CompareProperties";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { t } from "@lingui/macro";

import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import { messages as enMessages } from "./locales/en/messages.po";
import { messages as taMessages } from "./locales/ta/messages.po";
import { messages as hiMessages } from "./locales/hi/messages.po";

import { io } from "socket.io-client";
import { Toaster, toast } from "react-hot-toast";
import Seo from "./components/Seo";

const savedLang = localStorage.getItem("lang") || "en";
i18n.load("en", enMessages);
i18n.load("ta", taMessages);
i18n.load("hi", hiMessages);
i18n.activate(savedLang);

// Initialize Socket outside or in a useMemo to prevent multiple instances
const socket = io(`${import.meta.env.VITE_API_URL}`, {
  autoConnect: true,
});

function RouteSeo() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/property/")) return null;
  const pages = {
    "/": { title: "Verified Properties in Tamil Nadu", description: "Discover verified land, homes, and apartments in Tamil Nadu with Estatera.", path: "/" },
    "/listings": { title: "Browse Verified Properties", description: "Browse verified land, houses, and apartments in Tamil Nadu.", path: "/listings" },
    "/contact": { title: "Contact Estatera", description: "Speak with Estatera about verified properties and private viewings.", path: "/contact" },
    "/compare": { title: "Compare Properties", description: "Compare selected Estatera properties side by side.", path: "/compare" },
  };
  if (pages[pathname]) return <Seo {...pages[pathname]} />;
  return <Seo title="Private Account" description="Estatera private account area." path={pathname} noIndex />;
}

function App() {
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.user) {
      // 1. Identity yourself to the backend
      socket.emit("join", {
        userId: user.user.id,
        role: user.user.role,
      });

      // 2. Listen for User Notifications
      socket.on("user_notification", (data) => {
        toast.success(data.message, {
          duration: 5000,
          position: "top-right",
          icon: "📅",
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
      });

      // 3. Listen for Admin Notifications
      socket.on("admin_notification", (data) => {
        toast(data.message, {
          duration: 6000,
          position: "top-right",
          icon: "🔔",
          style: {
            border: "2px solid #2563eb",
            padding: "16px",
            fontWeight: "bold",
          },
        });
      });
    }

    // Cleanup listeners on logout or unmount
    return () => {
      socket.off("user_notification");
      socket.off("admin_notification");
    };
  }, [user]);

  return (
    <>
      <I18nProvider i18n={i18n}>
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            // Global styles for all toasts
            duration: 5000,
            style: {
              background: "#1e293b", // Slate 800
              color: "#fff",
              borderRadius: "20px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: "bold",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#fff" },
            },
          }}
        />
        <Router>
          <ScrollToTop />
          <RouteSeo />
          <Navbar />
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/listings" element={<Listings />} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/compare" element={<CompareProperties />} />
                <Route path="/profile" element={<Profile />} />

                {/* Protected Admin Route */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </I18nProvider>
    </>
  );
}

export default App;
