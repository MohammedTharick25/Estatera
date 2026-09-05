import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Shield,
  User as UserIcon,
  ArrowRight,
  Camera,
  Edit3,
  X,
  Check,
  Loader2,
  Star,
  MessageSquare,
  Heart,
  Clock3,
  Bookmark,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import PropertyCard from "../components/PropertyCard";
import { toast } from "react-hot-toast";

export default function Profile() {
  const { i18n } = useLingui();
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  const [activeProfileTab, setActiveProfileTab] = useState("visits");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [myVisits, setMyVisits] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [feedbackData, setFeedbackData] = useState({ rating: 5, comment: "" });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", password: "", confirmPassword: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.user?.name || "",
    email: user?.user?.email || "",
    language: user?.user?.language || "en",
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch Data on Load
  useEffect(() => {
    setInterval(() => {
      if (user?.user?.id) {
        fetchMyVisits();
        fetchFavorites();
      }
    }, 3000); // Poll every 3 seconds for updates
  }, [user?.user?.id, user?.user?.favorites]); // Refetch if ID changes or wishlist updates

  const fetchMyVisits = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/visits/user/${user.user.id}`,
      );
      setMyVisits(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users/favorites/${user.user.id}`,
      );
      setFavorites(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadRecentlyViewed = async () => {
      try {
        const history = JSON.parse(localStorage.getItem("recentlyViewedProperties") || "[]");
        if (!history.length) return setRecentlyViewed([]);
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/listings`);
        const order = new Map(history.map((entry, index) => [entry.id, index]));
        setRecentlyViewed(data.filter((listing) => order.has(listing._id)).sort((a, b) => order.get(a._id) - order.get(b._id)));
      } catch (_) { setRecentlyViewed([]); }
    };
    loadRecentlyViewed();
  }, []);

  const fetchSavedSearches = async () => {
    if (!user?.user?.id) return;
    try { const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/saved-searches`); setSavedSearches(data); } catch (_) { setSavedSearches([]); }
  };
  useEffect(() => { fetchSavedSearches(); }, [user?.user?.id]);
  const deleteSavedSearch = async (id) => { try { await axios.delete(`${import.meta.env.VITE_API_URL}/api/saved-searches/${id}`); setSavedSearches((searches) => searches.filter((search) => search._id !== id)); toast.success("Saved search removed."); } catch (_) { toast.error("Unable to remove saved search."); } };
  const updateSavedSearchAlert = async (search, update) => { try { const { data } = await axios.patch(`${import.meta.env.VITE_API_URL}/api/saved-searches/${search._id}`, update); setSavedSearches((items) => items.map((item) => item._id === search._id ? data : item)); toast.success("Alert preferences updated."); } catch (_) { toast.error("Unable to update alert preferences."); } };
  const openSavedSearch = (search) => { const filters = search.filters || {}; const params = new URLSearchParams(); if (filters.location) params.set("location", filters.location); if (filters.type) params.set("type", filters.type); if (filters.maxPrice) params.set("maxPrice", filters.maxPrice); if (filters.radius) params.set("radius", filters.radius); if (filters.sort) params.set("sort", filters.sort); navigate(`/listings?${params}`); };

  const submitFeedback = async (visitId) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/visits/${visitId}/feedback`,
        feedbackData,
      );
      toast.success(t`Message sent successfully!`);
      fetchMyVisits();
    } catch (err) {
      toast.error(t`Failed to send message`);
    }
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setFormData((prev) => ({ ...prev, language: lang }));
    i18n.activate(lang);
    localStorage.setItem("lang", lang);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("language", formData.language);
    data.append("id", user.user.id);
    if (selectedFile) data.append("image", selectedFile);

    setLoading(true);
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/update`,
        data,
      );
      login(res.data);
      setIsEditing(false);
      setPreviewImage(null);
    } catch (err) {
      toast.error(t`Profile update failed`);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwordData.password !== passwordData.confirmPassword) return toast.error("New passwords do not match.");
    setIsChangingPassword(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, passwordData);
      toast.success(data.message); setPasswordData({ currentPassword: "", password: "", confirmPassword: "" }); setShowPasswordForm(false);
    } catch (error) { toast.error(error.response?.data?.error || "Unable to change password."); }
    finally { setIsChangingPassword(false); }
  };
  const loadSessions = async () => { try { const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/sessions`); setSessions(data.sessions || []); setCurrentSessionId(data.currentSessionId); } catch (error) { toast.error(error.response?.data?.error || "Unable to load sessions."); } };
  const toggleSessions = () => { const next = !showSessions; setShowSessions(next); if (next) loadSessions(); };
  const revokeSession = async (sessionId) => { try { const { data } = await axios.delete(`${import.meta.env.VITE_API_URL}/api/auth/sessions/${sessionId}`); toast.success(data.message); loadSessions(); } catch (error) { toast.error(error.response?.data?.error || "Unable to sign out the session."); } };
  const revokeOtherSessions = async () => { try { const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/sessions/revoke-others`); toast.success(data.message); loadSessions(); } catch (error) { toast.error(error.response?.data?.error || "Unable to sign out other sessions."); } };

  // Helper for Status Colors
  const getStatusStyles = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "scheduled":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "visited":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  const currentAvatar =
    previewImage ||
    user?.user?.image ||
    `https://ui-avatars.com/api/?name=${user.user.name}&background=2563eb&color=fff&size=200`;

  return (
    <div className="min-h-screen" style={{ background: "var(--canvas)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl px-5 py-20"
      >
        <div className="luxury-surface overflow-hidden rounded-[2rem]">
          <div className="h-36 bg-[linear-gradient(110deg,#0d2c24,#285645_55%,#b88a45)]" />

          <div className="px-8 pb-12 relative">
            <div className="relative -mt-16 mb-6 flex justify-center">
              <div className="relative group w-fit">
                <img
                  src={currentAvatar}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 shadow-xl object-cover"
                  alt="Avatar"
                />
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white"
                  >
                    <Camera />
                  </button>
                )}
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    setSelectedFile(e.target.files[0]);
                    setPreviewImage(URL.createObjectURL(e.target.files[0]));
                  }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!isEditing ? (
                <motion.div
                  key="view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="editorial-label mb-2 text-amber-700 dark:text-amber-400">Private profile</p>
                      <h1 className="display-face text-5xl font-bold text-slate-900 dark:text-white">
                        {user.user.name}
                      </h1>
                      <p className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 mt-1 lowercase">
                        <Mail size={16} /> {user.user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="luxury-button flex items-center gap-2 rounded-xl px-6 py-3 font-bold"
                    >
                      <Edit3 size={16} /> {t`Edit Profile`}
                    </button>
                  </div>

                  {/* Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                    <div className="rounded-3xl border border-stone-200 bg-[#f0ede4] p-6 dark:border-slate-700 dark:bg-slate-800">
                      <h3 className="font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <UserIcon size={18} /> {t`Edit Profile`}
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">{t`Full Name`}</span>
                          <span className="font-black text-slate-900 dark:text-white">
                            {user.user.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">{t`Email`}</span>
                          <span className="font-black text-slate-900 dark:text-white">
                            {user.user.email}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">{t`Preferred Language`}</span>
                          <span className="font-black text-slate-900 dark:text-white">
                            {formData.language === "hi"
                              ? t`Hindi`
                              : formData.language === "ta"
                                ? t`Tamil`
                                : t`English`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="relative group overflow-hidden rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm transition-all duration-500 hover:shadow-xl dark:border-slate-700/50 dark:bg-slate-800/50">
                      {/* Abstract Background Decoration */}
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-600/10 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                              <Shield size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                              <h3 className="font-black text-slate-800 dark:text-white leading-none">
                                {t`Security & Access`}
                              </h3>
                              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">
                                {t`System Identity`}
                              </p>
                            </div>
                          </div>

                          {/* Dynamic Status Pill */}
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">
                              {t`Verified`}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              {t`Account Tier`}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider shadow-sm 
          ${
            user.user.role === "admin"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
          }`}
                            >
                              {user.user.role}
                            </span>
                          </div>
                          <button onClick={() => setShowPasswordForm((show) => !show)} className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left text-xs font-black text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">{showPasswordForm ? "Cancel password change" : "Change password"}</button>
                          {showPasswordForm && <form onSubmit={changePassword} className="space-y-3 rounded-2xl border border-stone-200 p-4 dark:border-slate-700"><p className="text-xs font-bold text-slate-500">Use at least 8 characters with uppercase, lowercase, and a number.</p><input type="password" autoComplete="current-password" required value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} placeholder="Current password" className="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/><input type="password" autoComplete="new-password" required value={passwordData.password} onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })} placeholder="New password" className="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/><input type="password" autoComplete="new-password" required value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} placeholder="Confirm new password" className="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/><button disabled={isChangingPassword} className="w-full rounded-xl bg-emerald-950 py-3 text-sm font-black text-white disabled:opacity-50">{isChangingPassword ? "Updating…" : "Update password"}</button></form>}
                          <button onClick={toggleSessions} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-left text-xs font-black text-stone-700 transition hover:bg-stone-100 dark:border-slate-700 dark:bg-slate-800 dark:text-stone-200">{showSessions ? "Hide active sessions" : "Manage active sessions"}</button>
                          {showSessions && <div className="space-y-3 rounded-2xl border border-stone-200 p-4 dark:border-slate-700"><div className="flex items-center justify-between gap-3"><p className="text-xs font-black text-slate-700 dark:text-white">Active devices</p>{sessions.length > 1 && <button onClick={revokeOtherSessions} className="text-xs font-black text-red-600 hover:underline">Sign out others</button>}</div>{sessions.length ? sessions.map((session) => <div key={session.sessionId} className="rounded-xl bg-stone-50 p-3 text-xs dark:bg-slate-800"><div className="flex justify-between gap-3"><p className="min-w-0 truncate font-bold text-slate-700 dark:text-white">{session.userAgent || "Unknown device"}</p>{session.sessionId === currentSessionId ? <span className="shrink-0 font-black text-emerald-700 dark:text-emerald-300">This device</span> : <button onClick={() => revokeSession(session.sessionId)} className="shrink-0 font-black text-red-600">Sign out</button>}</div><p className="mt-1 text-[10px] text-slate-400">Signed in {new Date(session.createdAt).toLocaleString()}</p></div>) : <p className="text-xs text-slate-500">No active sessions found.</p>}</div>}

                          {/* Role Capabilities Summary - Professional Touch */}
                          <div className="pt-2 px-1">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 italic">
                              {t`Authorized Capabilities`}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {user.user.role === "admin" ? (
                                <>
                                  <CapabilityItem label={t`Full Access`} />
                                  <CapabilityItem
                                    label={t`Property Management`}
                                  />
                                  {/*user */}
                                  <CapabilityItem
                                    label={t`Inventory Control`}
                                  />
                                  <CapabilityItem label={t`Financial Logs`} />
                                </>
                              ) : (
                                <>
                                  <CapabilityItem label={t`Property Tours`} />
                                  <CapabilityItem label={t`Request Visits`} />
                                  <CapabilityItem label={t`Save Favorites`} />
                                  <CapabilityItem label={t`Direct Chat`} />
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabs Section */}
                  <div className="mt-12">
                    <div className="flex border-b dark:border-slate-800 mb-8 overflow-x-auto">
                      <button
                        onClick={() => setActiveProfileTab("visits")}
                        className={`flex items-center gap-2 border-b-2 px-6 py-4 font-bold transition-all ${activeProfileTab === "visits" ? "border-emerald-800 text-emerald-800 dark:text-emerald-300" : "border-transparent text-slate-400"}`}
                      >
                        <MessageSquare size={18} /> {t`Schedule a Visit`}
                      </button>
                      <button
                        onClick={() => setActiveProfileTab("favorites")}
                        className={`flex items-center gap-2 border-b-2 px-6 py-4 font-bold transition-all ${activeProfileTab === "favorites" ? "border-emerald-800 text-emerald-800 dark:text-emerald-300" : "border-transparent text-slate-400"}`}
                      >
                        <Heart size={18} /> {t`Wishlist`}
                      </button>
                      <button
                        onClick={() => setActiveProfileTab("recent")}
                        className={`flex items-center gap-2 border-b-2 px-6 py-4 font-bold transition-all ${activeProfileTab === "recent" ? "border-emerald-800 text-emerald-800 dark:text-emerald-300" : "border-transparent text-slate-400"}`}
                      >
                        <Clock3 size={18} /> Recently Viewed
                      </button>
                      <button onClick={() => { setActiveProfileTab("saved"); fetchSavedSearches(); }} className={`flex items-center gap-2 border-b-2 px-6 py-4 font-bold transition-all ${activeProfileTab === "saved" ? "border-emerald-800 text-emerald-800 dark:text-emerald-300" : "border-transparent text-slate-400"}`}><Bookmark size={18} /> Saved Searches</button>
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                      {activeProfileTab === "visits" ? (
                        <motion.div
                          key="visits-list"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="grid grid-cols-1 gap-4"
                        >
                          {myVisits.length > 0 ? (
                            myVisits.map((v) => (
                              <div
                                key={v._id}
                                className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700"
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-bold dark:text-white">
                                      {v.propertyId?.title ||
                                        "Property no longer available"}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {v.propertyId?.location ||
                                        "Location unavailable"}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${getStatusStyles(v.status)}`}
                                  >
                                    {v.status}
                                  </span>
                                </div>
                                {v.scheduledFor && <p className="mt-3 text-xs font-bold text-emerald-800 dark:text-emerald-300">Your visit is scheduled for {new Date(v.scheduledFor).toLocaleString()}.</p>}
                                {v.status === "visited" &&
                                  !v.feedback?.rating && (
                                    <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-blue-200 dark:border-slate-700">
                                      <p className="text-sm font-bold mb-3 dark:text-white">{t`Rate your experience`}</p>
                                      <div className="flex gap-2 mb-4">
                                        {[1, 2, 3, 4, 5].map((num) => (
                                          <Star
                                            key={num}
                                            size={20}
                                            className="cursor-pointer"
                                            fill={
                                              feedbackData.rating >= num
                                                ? "gold"
                                                : "none"
                                            }
                                            color={
                                              feedbackData.rating >= num
                                                ? "gold"
                                                : "gray"
                                            }
                                            onClick={() =>
                                              setFeedbackData({
                                                ...feedbackData,
                                                rating: num,
                                              })
                                            }
                                          />
                                        ))}
                                      </div>
                                      <textarea
                                        placeholder={t`Your Message...`}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4 text-sm outline-none dark:text-white"
                                        onChange={(e) =>
                                          setFeedbackData({
                                            ...feedbackData,
                                            comment: e.target.value,
                                          })
                                        }
                                      />
                                      <button
                                        onClick={() => submitFeedback(v._id)}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm"
                                      >{t`Save Changes`}</button>
                                    </div>
                                  )}
                                {v.feedback?.rating && (
                                  <div className="mt-2 text-sm text-slate-500 italic">
                                    "{v.feedback.comment}" - {v.feedback.rating}
                                    /5 ⭐
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-slate-500 py-10">{t`No properties found.`}</p>
                          )}
                        </motion.div>
                      ) : activeProfileTab === "favorites" ? (
                        <motion.div
                          key="favorites-grid"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                        >
                          {favorites.length > 0 ? (
                            favorites.map((property) => (
                              <PropertyCard
                                key={property._id}
                                property={property}
                              />
                            ))
                          ) : (
                            <p className="text-center text-slate-500 py-10 col-span-2">{t`No properties found.`}</p>
                          )}
                        </motion.div>
                      ) : activeProfileTab === "recent" ? (
                        <motion.div key="recent-grid" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          {recentlyViewed.length ? recentlyViewed.map((property) => <PropertyCard key={property._id} property={property} />) : <p className="col-span-2 py-10 text-center text-slate-500">No recently viewed properties yet.</p>}
                        </motion.div>
                      ) : (
                        <motion.div key="saved-searches" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
                          {savedSearches.length ? savedSearches.map((search) => <div key={search._id} className="luxury-surface flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"><div><p className="font-black dark:text-white">{search.name}</p><p className="mt-1 text-xs text-slate-500">{[search.filters?.location, search.filters?.type, search.filters?.maxPrice ? `Up to ₹${Number(search.filters.maxPrice).toLocaleString()}` : ""].filter(Boolean).join(" · ") || "All properties"}</p><p className="mt-2 text-[11px] text-stone-500">All active members receive an email whenever a new property is published. These controls manage personalised saved-search matches and digests.</p><div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-stone-600 dark:text-stone-300"><label className="flex items-center gap-2"><input type="checkbox" checked={search.alertEnabled !== false} onChange={(e) => updateSavedSearchAlert(search, { alertEnabled: e.target.checked })} /> Personalised alerts</label><select value={search.alertFrequency || "immediate"} disabled={search.alertEnabled === false} onChange={(e) => updateSavedSearchAlert(search, { alertFrequency: e.target.value })} className="rounded-md border border-stone-200 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800"><option value="immediate">Instant in-app match</option><option value="daily">Daily email digest</option><option value="weekly">Weekly email digest</option></select></div></div><div className="flex gap-2"><button onClick={() => openSavedSearch(search)} className="rounded-lg bg-emerald-950 px-3 py-2 text-xs font-black text-white">Open</button><button onClick={() => deleteSavedSearch(search._id)} aria-label={`Delete ${search.name}`} className="rounded-lg bg-red-50 p-2 text-red-500"><Trash2 size={16}/></button></div></div>) : <p className="py-10 text-center text-slate-500">Save a search from the Listings page to keep it here.</p>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Actions */}
                  <div className="mt-12 flex flex-col sm:flex-row gap-4">
                    {user.user.role === "admin" && (
                      <button
                        onClick={() => navigate("/admin")}
                        className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        {t`Manage Dashboard`} <ArrowRight size={20} />
                      </button>
                    )}
                    <button
                      onClick={logout}
                      className="flex-1 border-2 border-red-200 text-red-500 py-4 rounded-2xl font-black text-lg hover:bg-red-50"
                    >{t`Sign Out`}</button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="edit"
                  onSubmit={handleSave}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t`Edit Profile`}</h2>
                    <button type="button" onClick={() => setIsEditing(false)}>
                      <X />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 dark:text-white outline-none"
                    placeholder={t`Full Name`}
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 dark:text-white outline-none"
                    placeholder={t`Email`}
                  />
                  <div>
                    <label className="block mb-2 font-bold dark:text-white">{t`Preferred Language`}</label>
                    <select
                      value={formData.language}
                      onChange={handleLanguageChange}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 dark:text-white outline-none"
                    >
                      <option value="en">{t`English`}</option>
                      <option value="hi">{t`Hindi`}</option>
                      <option value="ta">{t`Tamil`}</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Check />}{" "}
                    {loading ? t`Saving...` : t`Save Changes`}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CapabilityItem({ label }) {
  return (
    <div className="flex items-center gap-2 group/item">
      <div className="w-1 h-1 bg-blue-500 rounded-full group-hover/item:w-3 transition-all" />
      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
        {label}
      </span>
    </div>
  );
}
