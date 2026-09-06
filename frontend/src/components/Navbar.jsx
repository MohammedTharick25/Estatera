import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Home,
  List,
  Phone,
  Scale,
  Bell,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";

export default function Navbar() {
  // Ensure the component re-renders when language changes
  useLingui();

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const notificationPanelRef = useRef(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const captureInstallPrompt = (event) => { event.preventDefault(); setDeferredInstallPrompt(event); };
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
  }, []);

  useEffect(() => {
    if (!isNotificationsOpen) return;
    const closeOnOutsidePress = (event) => {
      if (!notificationPanelRef.current?.contains(event.target)) setIsNotificationsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, [isNotificationsOpen]);

  const installApp = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    setDeferredInstallPrompt(null);
  };

  const loadNotifications = async () => {
    if (!user?.user?.id) return;
    try { const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`); setNotifications(data.notifications); setUnreadCount(data.unreadCount); } catch (_) { /* An unavailable notification service should not affect navigation. */ }
  };
  useEffect(() => { loadNotifications(); const timer = setInterval(loadNotifications, 30000); return () => clearInterval(timer); }, [user?.user?.id]);
  const markAllRead = async () => { try { await axios.patch(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`); setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }))); setUnreadCount(0); } catch (_) {} };
  const markNotificationRead = async (id) => {
    const item = notifications.find((notification) => notification._id === id);
    if (!item || item.readAt) return;
    setNotifications((items) => items.map((notification) => notification._id === id ? { ...notification, readAt: new Date().toISOString() } : notification));
    setUnreadCount((count) => Math.max(0, count - 1));
    try { await axios.patch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`); } catch (_) { loadNotifications(); }
  };
  const deleteNotification = async (event, id) => {
    event.preventDefault(); event.stopPropagation();
    const item = notifications.find((notification) => notification._id === id);
    setNotifications((items) => items.filter((notification) => notification._id !== id));
    if (item && !item.readAt) setUnreadCount((count) => Math.max(0, count - 1));
    try { await axios.delete(`${import.meta.env.VITE_API_URL}/api/notifications/${id}`); } catch (_) { loadNotifications(); }
  };

  // Links defined inside to catch translation updates
  const navLinks = [
    { name: t`Home`, path: "/", icon: <Home size={20} /> },
    { name: t`Browse Properties`, path: "/listings", icon: <List size={20} /> },
    { name: t`Contact`, path: "/contact", icon: <Phone size={20} /> },
  ];

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-[1000] border-b border-stone-200/80 bg-[#fdfbf6]/90 backdrop-blur-xl dark:border-stone-700 dark:bg-[#101916]/90">
      <div className="mx-auto flex max-w-[76rem] items-center justify-between gap-4 px-5 py-4">
        <Link
          to="/"
          className="display-face flex text-3xl font-bold tracking-tight text-emerald-950 dark:text-stone-100"
        >
          Estatera
        </Link>

        <div className="hidden md:flex items-center gap-8 font-semibold text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`transition-colors hover:text-emerald-800 ${
                location.pathname === link.path
                  ? "text-emerald-800 dark:text-amber-300"
                  : "text-stone-600 dark:text-stone-400"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/compare" aria-label="Compare properties" className="hidden rounded-full p-2.5 text-stone-600 transition hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-slate-800 md:block"><Scale size={20}/></Link>
          {user && <div ref={notificationPanelRef} className="relative">
            <button onClick={() => { setIsNotificationsOpen((open) => !open); loadNotifications(); }} aria-label="Notifications" className="relative rounded-full p-2.5 text-stone-600 transition hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-slate-800">
              <Bell size={20}/>{unreadCount > 0 && <span className="absolute right-1 top-1 min-w-4 rounded-full bg-red-600 px-1 text-[10px] font-black leading-4 text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
            {isNotificationsOpen && <div className="fixed left-4 right-4 top-20 z-[80] max-h-[calc(100dvh-6rem)] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 md:absolute md:left-auto md:right-0 md:top-12 md:w-80 md:max-h-[30rem]">
              <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 dark:border-slate-800"><p className="font-black dark:text-white">Notifications</p>{unreadCount > 0 && <button onClick={markAllRead} className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Mark all read</button>}</div>
              <div className="max-h-96 overflow-y-auto">{notifications.length ? notifications.map((item) => <div key={item._id} className={`group relative border-b border-stone-100 transition hover:bg-stone-50 dark:border-slate-800 dark:hover:bg-slate-800 ${item.readAt ? "opacity-60" : "bg-emerald-50/50 dark:bg-emerald-950/20"}`}><Link to={item.link || "/profile"} onClick={() => { markNotificationRead(item._id); setIsNotificationsOpen(false); }} className="block px-4 py-3 pr-11"><p className="text-sm font-bold dark:text-white">{item.title}</p><p className="mt-1 text-xs leading-5 text-stone-600 dark:text-stone-300">{item.message}</p><p className="mt-1 text-[10px] text-stone-400">{item.eventAt ? `Scheduled for ${new Date(item.eventAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` : `Sent ${new Date(item.createdAt).toLocaleString()}`}</p></Link><button onClick={(event) => deleteNotification(event, item._id)} aria-label={`Delete ${item.title} notification`} className="absolute right-2 top-2 rounded-full p-1.5 text-stone-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 md:opacity-0 md:group-hover:opacity-100"><X size={14}/></button></div>) : <p className="px-4 py-10 text-center text-sm text-stone-500">No notifications yet.</p>}</div>
            </div>}
          </div>}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label="Toggle colour theme"
            className="hidden rounded-full p-2.5 transition hover:bg-stone-100 dark:hover:bg-slate-800 md:block"
          >
            {isDarkMode ? (
              <Sun size={20} className="text-yellow-400" />
            ) : (
              <Moon size={20} />
            )}
          </button>

          {user ? (
            <button
              onClick={() => navigate("/profile")}
              className="hidden h-10 w-10 overflow-hidden rounded-full border-2 border-stone-200 transition hover:border-emerald-800 dark:border-stone-700 md:block"
            >
              <img
                src={
                  user?.user?.image ||
                  `https://ui-avatars.com/api/?name=${user?.user?.name || "User"}`
                }
                alt={t`Full Name`}
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-full bg-emerald-950 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-800 sm:block"
            >
              {t`Login`}
            </Link>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-slate-900 dark:text-white"
          >
            <Menu size={28} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed top-0 right-0 z-[1100] flex h-[100dvh] w-[85%] max-w-[320px] flex-col border-l border-stone-200 bg-[#fdfbf6] shadow-2xl dark:border-stone-700 dark:bg-slate-900"
            >
              <div className="p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                <span className="display-face text-2xl font-bold text-emerald-900 dark:text-emerald-200">
                  {t`Manage All`}
                </span>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 px-4 py-6 flex flex-col gap-2">
                {user && <Link to="/profile" onClick={closeMenu} className="mb-3 flex items-center gap-3 rounded-2xl bg-emerald-950 p-3 text-white"><img src={user?.user?.image || `https://ui-avatars.com/api/?name=${user?.user?.name || "User"}`} alt="" className="h-10 w-10 rounded-full object-cover"/><span className="min-w-0"><span className="block truncate text-sm font-black">{user?.user?.name}</span><span className="block text-xs text-emerald-100">Profile</span></span></Link>}
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={closeMenu}
                    className="flex items-center gap-4 p-4 rounded-xl font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                ))}

                <Link to="/compare" onClick={closeMenu} className="flex items-center gap-4 rounded-xl p-4 font-semibold text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800">
                  <Scale size={20} /> Compare properties
                </Link>

                <button onClick={() => setIsDarkMode((dark) => !dark)} className="flex items-center gap-4 rounded-xl p-4 text-left font-semibold text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800">
                  {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />} {isDarkMode ? "Light theme" : "Dark theme"}
                </button>
                {deferredInstallPrompt && <button onClick={installApp} className="flex items-center justify-center rounded-xl bg-emerald-800 p-4 text-sm font-bold text-white">Install Estatera app</button>}

                {user ? (
                  <>
                    <button
                      onClick={() => {
                        logout();
                        closeMenu();
                      }}
                      className="flex items-center gap-4 p-4 text-red-500 font-semibold"
                    >
                      <LogOut size={20} />
                      {t`Sign Out`}
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="mt-4 flex justify-center rounded-xl bg-emerald-950 p-4 text-white"
                  >
                    {t`Login`}
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
