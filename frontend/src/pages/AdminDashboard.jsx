import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Toaster, toast } from "react-hot-toast";

import {
  Plus,
  Trash2,
  Menu,
  X,
  LayoutGrid,
  Calendar,
  Star,
  Search,
  MapPin,
  RefreshCw,
  BarChart3,
  Users,
  IndianRupee,
  TrendingUp,
  Eye,
  Phone,
  Video,
  Building2,
  FileDown,
  FileText,
  PieChart as PieIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { t } from "@lingui/macro";
import LocationPicker from "../components/LocationPicker";
import Swal from "sweetalert2";
import {
  UserX,
  UserCheck,
  ShieldAlert,
  Mail,
  ShieldCheck,
  Download,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import autoTable from "jspdf-autotable";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listings, setListings] = useState([]);
  const [visits, setVisits] = useState([]);
  const [stats, setStats] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingListingId, setEditingListingId] = useState(null);
  const [retainedImages, setRetainedImages] = useState([]);
  const [retainedVideos, setRetainedVideos] = useState([]);
  const [visitCheckId, setVisitCheckId] = useState(null);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryStatus, setInventoryStatus] = useState("all");
  const [inventoryType, setInventoryType] = useState("all");
  const [selectedListingIds, setSelectedListingIds] = useState([]);
  const [inventoryListings, setInventoryListings] = useState([]);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryMeta, setInventoryMeta] = useState({ total: 0, totalPages: 1 });
  const [inventoryArchived, setInventoryArchived] = useState("false");
  const [inventoryLifecycle, setInventoryLifecycle] = useState("all");
  const [showListingPreview, setShowListingPreview] = useState(false);
  const [visitCalendarMode, setVisitCalendarMode] = useState("month");
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [visitStatusFilter, setVisitStatusFilter] = useState("all");
  const [visitPropertyFilter, setVisitPropertyFilter] = useState("all");
  const [visitAgentFilter, setVisitAgentFilter] = useState("all");

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    location: "",
    size: "",
    propertyType: "Land",
    description: "",
    featured: false, // 👈 Add this
    amenities: "",
    latitude: 13.0827,
    longitude: 80.2707,
    lifecycle: "draft",
  });
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);

  const [users, setUsers] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [userDirectoryView, setUserDirectoryView] = useState("cards");
  const [userPage, setUserPage] = useState(1);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users/all`,
      );
      setUsers(res.data);
    } catch (err) {
      console.error("User fetch error", err);
    }
  };

  const fetchInquiries = async () => {
    try { const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/inquiries`); setInquiries(res.data); } catch (err) { console.error("Inquiry fetch error", err); }
  };

  // FETCH FUNCTIONS
  const fetchStats = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/stats`,
      );
      console.log("Full Stats from Server:", res.data);
      setStats(res.data);
    } catch (err) {
      console.error("Stats error", err);
    }
  };

  const fetchListings = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/listings`);
    setListings(res.data);
  };

  const fetchInventory = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/listings/admin/inventory`, { params: { page: inventoryPage, limit: 10, search: inventorySearch, status: inventoryStatus, type: inventoryType, lifecycle: inventoryLifecycle, archived: inventoryArchived } });
      setInventoryListings(data.items); setInventoryMeta({ total: data.total, totalPages: data.totalPages });
    } catch (_) { toast.error("Unable to load inventory."); }
  };

  const fetchVisits = async () => {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/visits/admin`,
    );
    setVisits(res.data);
  };

  // INITIAL LOAD & AUTO-POLLING
  useEffect(() => {
    fetchListings();
    fetchVisits();
    fetchStats();
    fetchUsers();
    fetchInquiries();

    const poll = setInterval(() => {
      fetchStats();
      fetchUsers();
      fetchInquiries();
    }, 5000); // Auto-update every 5s
    return () => clearInterval(poll);
  }, []);

  useEffect(() => { if (activeTab === "manage") fetchInventory(); }, [activeTab, inventoryPage, inventorySearch, inventoryStatus, inventoryType, inventoryLifecycle, inventoryArchived]);
  useEffect(() => { setSelectedListingIds([]); }, [inventoryPage, inventorySearch, inventoryStatus, inventoryType, inventoryLifecycle, inventoryArchived]);
  useEffect(() => { setUserPage(1); }, [userSearch, userFilter]);

  const updateInquiry = async (id, status) => {
    try { await axios.patch(`${import.meta.env.VITE_API_URL}/api/inquiries/${id}`, { status }); toast.success("Inquiry updated"); fetchInquiries(); } catch (_) { toast.error("Unable to update inquiry"); }
  };

  // HANDLERS
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Available" ? "Sold" : "Available";
    await axios.patch(
      `${import.meta.env.VITE_API_URL}/api/listings/${id}/status`,
      {
        status: newStatus,
      },
    );
    toast.success(t`Status updated to ${newStatus}`);
    await fetchListings();
    await fetchInventory();
    await fetchStats();
  };

  const handleToggleBlock = async (userId) => {
    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/users/${userId}/block`,
      );
      toast.success(res.data.message);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update user status");
    }
  };

  const exportUsersToCSV = () => {
    const headers = ["Name,Email,Role,Status,Favorites\n"];
    const rows = users.map(
      (u) =>
        `${u.name},${u.email},${u.role},${u.isBlocked ? "Blocked" : "Active"},${u.favorites?.length || 0}`,
    );
    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `User_Report_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  const exportStatsCSV = () => {
    const data = [
      ["ESTATERA BUSINESS SNAPSHOT"],
      ["Generated", new Date().toLocaleString("en-IN")],
      [],
      ["Metric", "Value", "Context"],
      ["Sold Value", stats.kpis.soldValue],
      ["Revenue", stats.kpis.revenue],
      ["Total Views", stats.kpis.totalViews],
      ["Total Visits", stats.kpis.totalVisits, "Customer visit requests"],
      ["Conversion Rate", `${stats.kpis.conversionRate}%`, "Views to visits"],
      ["Average Rating", stats.kpis.avgRating, `${stats.kpis.reviewCount} reviews`],
      [],
      ["TOP PROPERTIES"],
      ["Rank", "Property", "Price", "Views"],
      ...(stats.topProperties || []).map((property, index) => [`#${index + 1}`, property.title, property.price, property.views]),
      [],
      ["MONTHLY VISIT TREND"],
      ["Month", "Visit requests"],
      ...(stats.visitTrends || []).map((trend) => [trend._id, trend.count]),
    ];
    const escapeCell = (cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`;
    const blob = new Blob([data.map((row) => row.map(escapeCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Estatera_Business_Snapshot_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleDeleteUser = async (userId) => {
    const result = await Swal.fire({
      title: t`Delete User?`,
      text: t`This action is permanent and will remove all user data.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: t`Yes, delete`,
    });

    if (result.isConfirmed) {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${userId}`);
      fetchUsers();
      Swal.fire("Deleted!", "User removed.", "success");
    }
  };

  const exportFullReportPDF = () => {
    if (!stats) return toast.error("No data available to export");

    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    // 1. ESTATERA EXECUTIVE COVER
    doc.setFillColor(13, 44, 36);
    doc.rect(0, 0, 210, 54, "F");
    doc.setFillColor(184, 138, 69);
    doc.rect(0, 51, 210, 3, "F");
    doc.setTextColor(225, 195, 142);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("ESTATERA  /  PRIVATE INTELLIGENCE", 15, 14);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(25);
    doc.setFont("helvetica", "bold");
    doc.text("Portfolio performance", 15, 29);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(221, 232, 226);
    doc.text("Executive business intelligence report", 15, 38);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`REPORT ID  EST-${Math.floor(Math.random() * 100000)}`, 142, 18);
    doc.text(`GENERATED  ${timestamp}`, 142, 25);

    // 2. EXECUTIVE METRICS
    const metricCard = (x, label, value, accent) => { doc.setFillColor(248, 247, 242); doc.roundedRect(x, 64, 56, 27, 3, 3, "F"); doc.setFillColor(...accent); doc.roundedRect(x, 64, 3, 27, 3, 3, "F"); doc.setTextColor(107, 114, 128); doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text(label.toUpperCase(), x + 7, 72); doc.setTextColor(23, 32, 29); doc.setFontSize(13); doc.text(value, x + 7, 83); };
    metricCard(15, "Sold value", `INR ${Number(stats.kpis.soldValue || 0).toLocaleString()}`, [184, 138, 69]);
    metricCard(77, "Commission revenue", `INR ${Number(stats.kpis.revenue || 0).toLocaleString()}`, [32, 103, 83]);
    metricCard(139, "Conversion", `${stats.kpis.conversionRate || 0}%`, [37, 99, 235]);

    // 3. PERFORMANCE SCORECARD
    doc.setTextColor(23, 32, 29); doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text("Performance scorecard", 15, 106);
    doc.setTextColor(107, 114, 128); doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.text("Current operating metrics and customer-intent signals", 15, 112);
    autoTable(doc, {
      startY: 118,
      head: [["Key Performance Indicator", "Current Value", "Status"]],
      body: [
        [
          "Total Sold Value",
          `INR ${stats.kpis.soldValue.toLocaleString()}`,
          "Verified",
        ],
        [
          "Total Commission Revenue",
          `INR ${stats.kpis.revenue.toLocaleString()}`,
          "Calculated",
        ],
        ["Active Inventory Count", stats.kpis.totalListings.toString(), "Live"],
        ["Total Property Views", stats.kpis.totalViews.toLocaleString(), "Customer interest"],
        ["Total Visit Requests", stats.kpis.totalVisits.toString(), "Qualified intent"],
        [
          "Overall Conversion Rate",
          `${stats.kpis.conversionRate}%`,
          "Views to Visits",
        ],
        [
          "Average User Rating",
          `${stats.kpis.avgRating}/5`,
          `${stats.kpis.reviewCount} Reviews`,
        ],
      ],
      theme: "plain",
      headStyles: { fillColor: [13, 44, 36], textColor: [255, 255, 255], fontSize: 9, cellPadding: 3 },
      bodyStyles: { textColor: [48, 58, 54], fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 247, 242] },
      margin: { left: 15, right: 15 },
    });

    // 4. TOP PROPERTIES TABLE
    doc.setFontSize(14);
    doc.setTextColor(23, 32, 29);
    doc.text(
      "High-performance assets",
      15,
      doc.lastAutoTable.finalY + 15,
    );

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Rank", "Property Title", "Market Price", "Engagement (Views)"]],
      body: stats.topProperties.map((p, i) => [
        `#${i + 1}`,
        p.title,
        `INR ${p.price.toLocaleString()}`,
        `${p.views} Views`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [32, 103, 83], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 247, 242] },
    });

    // 5. FOOTER
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 228); doc.line(15, 282, 195, 282);
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(
        `ESTATERA REALTY GROUP  ·  CONFIDENTIAL  ·  PAGE ${i} OF ${pageCount}`,
        15,
        288,
      );
      doc.text(
        "Chennai, India",
        195,
        288,
        { align: "right" },
      );
    }

    doc.save(
      `Estatera_Intelligence_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
    );
    toast.success("Intelligence report generated successfully!");
  };

  const updateVisitStatus = async (id, status, scheduledFor, adminNote, notifyUser = true, assignedAgent) => {
    try {
      // We use toast.promise to handle the loading state and the final message from backend
      await toast.promise(
        axios.patch(`${import.meta.env.VITE_API_URL}/api/visits/${id}/status`, {
          status, scheduledFor, adminNote, notifyUser, assignedAgent,
        }),
        {
          loading: t`Updating status...`,
          success: (res) => {
            // fetch data in background to update UI
            fetchVisits();
            fetchStats();
            // This returns the message we just added to the backend
            return res.data.message;
          },
          error: t`Failed to update status.`,
        },
        {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        },
      );
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const scheduledVisits = visits.filter((visit) => {
    if (!visit.scheduledFor) return false;
    if (visitStatusFilter !== "all" && visit.status !== visitStatusFilter) return false;
    if (visitPropertyFilter !== "all" && visit.propertyId?._id !== visitPropertyFilter) return false;
    if (visitAgentFilter !== "all" && (visit.assignedAgent || "Unassigned") !== visitAgentFilter) return false;
    return true;
  });
  const calendarProperties = [...new Map(visits.filter((v) => v.propertyId?._id).map((v) => [v.propertyId._id, v.propertyId.title])).entries()];
  const calendarAgents = [...new Set(visits.map((v) => v.assignedAgent || "Unassigned"))];
  const filteredUsers = users.filter((user) => {
    const query = userSearch.trim().toLowerCase();
    if (query && !user.name?.toLowerCase().includes(query) && !user.email?.toLowerCase().includes(query)) return false;
    if (userFilter === "active") return !user.isBlocked;
    if (userFilter === "blocked") return user.isBlocked;
    if (userFilter === "admin") return user.role === "admin";
    return true;
  });
  const activeUserCount = users.filter((user) => !user.isBlocked).length;
  const blockedUserCount = users.filter((user) => user.isBlocked).length;
  const totalSavedProperties = users.reduce((total, user) => total + (user.favorites?.length || 0), 0);
  const usersPerPage = 10;
  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const paginatedUsers = filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Archive property?",
      text: "It will be removed from the public catalog and can be restored later.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Archive property",
    });

    if (result.isConfirmed) {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/listings/${id}/archive`, { archived: true });
      await fetchListings();
      await fetchInventory();
      await fetchStats();

      Swal.fire("Archived", "Property is hidden from the public catalog.", "success");
    }
  };

  const API_TOKEN = import.meta.env.VITE_LOCATIONIQ_ACCESS_TOKEN;

  const handleSearchAddress = async () => {
    if (!formData.location)
      return toast.error(t`Enter a location to search!`, { duration: 3000 });
    try {
      const res = await axios.get(
        `https://us1.locationiq.com/v1/search.php?key=${API_TOKEN}&q=${encodeURIComponent(formData.location)}&format=json`,
      );
      if (res.data?.[0]) {
        const { lat, lon, display_name } = res.data[0];
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          location: display_name,
        }));
        toast.success(t`Location synced!`);
      } else {
        toast.error(t`Location not found. Try a different query.`, {
          duration: 4000,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error(t`Failed to sync location.`);
    }
  };

  const handleMapPinSelect = async (lat, lng) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    try {
      const res = await axios.get(
        `https://us1.locationiq.com/v1/reverse.php?key=${API_TOKEN}&lat=${lat}&lon=${lng}&format=json`,
      );
      if (res.data?.display_name)
        setFormData((prev) => ({ ...prev, location: res.data.display_name }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const lifecycle = e.nativeEvent.submitter?.value || formData.lifecycle || "draft";

    if (!formData.title || !formData.price || !formData.location)
      return toast.error(t`Fill required fields!`, { duration: 3000 });

    setIsUploading(true);

    const formattedAmenities = formData.amenities
      ? formData.amenities.split(",").map((a) => a.trim())
      : [];

    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      if (key !== "amenities" && key !== "lifecycle") {
        data.append(key, formData[key]);
      }
    });
    data.append("lifecycle", lifecycle);

    // ✅ send amenities correctly
    formattedAmenities.forEach((a) => data.append("amenities", a));

    Array.from(images).forEach((img) => data.append("images", img));
    Array.from(videos).forEach((vid) => data.append("videos", vid));
    if (editingListingId) { data.append("retainedImagesJson", JSON.stringify(retainedImages)); data.append("retainedVideosJson", JSON.stringify(retainedVideos)); }

    const saveListing = async () => {
      const response = editingListingId ? await axios.patch(`${import.meta.env.VITE_API_URL}/api/listings/${editingListingId}`, data) : await axios.post(`${import.meta.env.VITE_API_URL}/api/listings`, data);
      if (editingListingId) await axios.patch(`${import.meta.env.VITE_API_URL}/api/listings/${editingListingId}/lifecycle`, { lifecycle });
      return response;
    };
    await toast.promise(
      saveListing(),
      {
        loading: t`Uploading property and media...`,
        success: () => {
          setFormData({
            title: "",
            price: "",
            location: "",
            size: "",
            propertyType: "Land",
            description: "",
            amenities: "",
            latitude: 13.0827, // 👈 Default instead of undefined
            longitude: 80.2707,
            lifecycle: "draft",
          });
          setImages([]);
          setVideos([]);
          setEditingListingId(null);
          setRetainedImages([]); setRetainedVideos([]);
          fetchListings();
          fetchStats();
          setActiveTab("manage");
          return <b>{editingListingId ? "Property lifecycle updated." : lifecycle === "draft" ? "Property saved as a draft." : "Property published successfully!"}</b>;
        },
        error: <b>{t`Could not save property.`}</b>,
      },
      {
        style: { borderRadius: "15px", background: "#333", color: "#fff" },
        success: { duration: 5000, icon: "🏠" },
      },
    );

    setIsUploading(false);
  };

  const beginListingEdit = (listing) => {
    setEditingListingId(listing._id);
    setFormData({ title: listing.title || "", price: listing.price || "", commission: listing.commission || 0, location: listing.location || "", size: listing.size || "", propertyType: listing.propertyType || "Land", description: listing.description || "", featured: Boolean(listing.featured), amenities: (listing.amenities || []).join(", "), latitude: listing.latitude, longitude: listing.longitude, lifecycle: listing.lifecycle || "published" });
    setImages([]); setVideos([]); setActiveTab("add");
    setRetainedImages(listing.images || []); setRetainedVideos(listing.videos || []);
  };

  const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
  // Dynamic sum of all views from properties
  const totalViewsCount =
    stats?.topProperties?.reduce((acc, curr) => acc + (curr.views || 0), 0) ||
    0;
  const filteredInventory = inventoryListings;
  const toggleListingSelection = (id) => setSelectedListingIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const bulkSetListingStatus = async (status) => {
    if (!selectedListingIds.length) return;
    try { await Promise.all(selectedListingIds.map((id) => axios.patch(`${import.meta.env.VITE_API_URL}/api/listings/${id}/status`, { status }))); toast.success(`${selectedListingIds.length} properties marked ${status}`); setSelectedListingIds([]); fetchListings(); fetchInventory(); fetchStats(); } catch (_) { toast.error("Unable to update selected properties."); }
  };
  const bulkArchive = async () => { if (!selectedListingIds.length) return; try { await Promise.all(selectedListingIds.map((id) => axios.patch(`${import.meta.env.VITE_API_URL}/api/listings/${id}/archive`, { archived: true }))); toast.success(`${selectedListingIds.length} properties archived`); setSelectedListingIds([]); fetchListings(); fetchInventory(); fetchStats(); } catch (_) { toast.error("Unable to archive selected properties."); } };
  const restoreListing = async (id) => { try { await axios.patch(`${import.meta.env.VITE_API_URL}/api/listings/${id}/archive`, { archived: false }); toast.success("Property restored to inventory."); fetchListings(); fetchInventory(); } catch (_) { toast.error("Unable to restore property."); } };
  const setListingLifecycle = async (id, lifecycle) => { try { await axios.patch(`${import.meta.env.VITE_API_URL}/api/listings/${id}/lifecycle`, { lifecycle }); toast.success(`Property moved to ${lifecycle}.`); fetchListings(); fetchInventory(); fetchStats(); } catch (error) { toast.error(error.response?.data?.error || "Unable to update property lifecycle."); } };

  return (
    <div className="flex min-h-screen min-w-0 flex-col items-stretch overflow-x-hidden transition-all lg:h-screen lg:overflow-hidden lg:flex-row" style={{ background: "var(--canvas)" }}>
      {/* Mobile and Tablet Top Bar */}
      <div className="sticky top-0 z-[900] flex items-center justify-between bg-slate-900 p-3 text-white shadow-xl lg:hidden">
        <h2 className="font-black uppercase tracking-tighter italic">
          AdminHub
        </h2>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-slate-800 rounded-lg active:scale-95 transition-transform"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* BACKDROP: Only shows on Mobile/Tablet when sidebar is open */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-[1050] bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      {/* <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`fixed md:sticky top-0 left-0 z-50 w-72 h-screen bg-slate-900 text-white p-6 flex flex-col overflow-y-auto transition-all ${
              sidebarOpen ? "block" : "hidden lg:flex"
            }`}
          >
            <h2 className="text-xl font-black uppercase mb-10 px-2 tracking-widest italic">
              Admin<span className="text-blue-500">Hub</span>
            </h2>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X />
            </button>
            <nav className="space-y-2 flex-1">
              <SideBtn
                active={activeTab === "overview"}
                icon={<BarChart3 size={20} />}
                label={t`Analytics`}
                onClick={() => setActiveTab("overview")}
              />
              <SideBtn
                active={activeTab === "add"}
                icon={<Plus size={20} />}
                label={t`Add Property`}
                onClick={() => setActiveTab("add")}
              />
              <SideBtn
                active={activeTab === "manage"}
                icon={<LayoutGrid size={20} />}
                label={t`Inventory`}
                onClick={() => setActiveTab("manage")}
              />
              <SideBtn
                active={activeTab === "visits"}
                icon={<Calendar size={20} />}
                label={t`Visits`}
                onClick={() => setActiveTab("visits")}
              />
            </nav>
            <div className="mt-auto flex items-center gap-2 text-[10px] text-emerald-400 font-bold">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {t`Live Stats Connected`}
            </div>
          </motion.aside>
        )}
      </AnimatePresence> */}

      {/* SIDEBAR */}
      <aside
        className={`
    fixed inset-y-0 left-0 z-[1100] flex h-[100dvh] w-[min(20rem,88vw)] flex-col overflow-hidden bg-slate-900 text-white shadow-2xl transition-transform duration-300 ease-in-out
    lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:translate-x-0 lg:shadow-none lg:z-auto lg:flex-shrink-0
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
  `}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-6 py-5">
          <h2 className="text-xl font-black uppercase px-2 tracking-widest italic">
            Admin<span className="text-blue-500">Hub</span>
          </h2>
          {/* Close button inside sidebar for tablet/mobile */}
          <button
            className="lg:hidden p-2 hover:bg-slate-800 rounded-full"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5 [scrollbar-width:thin]">
          <SideBtn
            active={activeTab === "overview"}
            icon={<BarChart3 size={20} />}
            label={t`Analytics`}
            onClick={() => {
              setActiveTab("overview");
              setSidebarOpen(false);
            }}
          />
          <SideBtn
            active={activeTab === "add"}
            icon={<Plus size={20} />}
            label={t`Add Property`}
            onClick={() => {
              setActiveTab("add");
              setSidebarOpen(false);
            }}
          />
          <SideBtn
            active={activeTab === "manage"}
            icon={<LayoutGrid size={20} />}
            label={t`Inventory`}
            onClick={() => {
              setActiveTab("manage");
              setSidebarOpen(false);
            }}
          />
          <SideBtn
            active={activeTab === "users"}
            icon={<Users size={20} />}
            label={t`Community`}
            onClick={() => {
              setActiveTab("users");
              setSidebarOpen(false);
            }}
          />
          <SideBtn
            active={activeTab === "visits"}
            icon={<Calendar size={20} />}
            label={t`Visits`}
            onClick={() => {
              setActiveTab("visits");
              setSidebarOpen(false);
            }}
          />
          <SideBtn
            active={activeTab === "inquiries"}
            icon={<Mail size={20} />}
            label="Inquiries"
            onClick={() => {
              setActiveTab("inquiries");
              setSidebarOpen(false);
            }}
          />
        </nav>

        <div className="flex shrink-0 items-center gap-2 border-t border-slate-800 px-6 py-5 text-[10px] font-bold text-emerald-400">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          {t`Live Stats Connected`}
        </div>
      </aside>

      <main className="min-w-0 w-full flex-1 p-4 sm:p-5 md:p-8 lg:h-screen lg:overflow-y-auto lg:p-10">
        <div className="mx-auto max-w-[76rem]">
          {activeTab === "overview" && stats && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight dark:text-white italic">
                    Business <span className="text-blue-600">Insights</span>
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Real-time performance analytics and property tracking.
                  </p>
                </div>
                <div className="flex gap-3"><button onClick={exportStatsCSV} className="flex items-center gap-2 rounded-2xl border bg-white px-5 py-2.5 text-sm font-bold transition-all hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"><FileText size={18} className="text-blue-600"/> CSV</button><button onClick={exportFullReportPDF} className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700"><FileDown size={18}/> Full Report (PDF)</button></div>
              </div>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <KPICard
                  title={t`Sold Value`}
                  value={`₹${(stats?.kpis?.soldValue || 0).toLocaleString()}`}
                  icon={<IndianRupee className="text-blue-600" />}
                  trend="+12%"
                />

                <KPICard
                  title={t`Commission Revenue`}
                  value={`₹${(stats?.kpis?.revenue || 0).toLocaleString()}`}
                  icon={<IndianRupee className="text-blue-600" />}
                  trend="+12%"
                />
                <KPICard
                  title={t`Active`}
                  value={stats.kpis.totalListings}
                  icon={<Building2 className="text-emerald-600" />}
                  trend="Live"
                />
                <KPICard
                  title={t`Total Views`}
                  value={totalViewsCount.toLocaleString()}
                  icon={<Eye className="text-blue-500" />}
                  trend="Sync"
                />
                <KPICard
                  title={t`Conversion`}
                  value={`${stats?.kpis?.conversionRate || 0}%`}
                  icon={<TrendingUp className="text-green-600" />}
                  trend="Views → Visits"
                />
                <KPICard
                  title={t`Rating`}
                  /* Ensure we handle both potential locations: stats.avgRating or stats.kpis.avgRating */
                  value={
                    stats?.kpis?.avgRating !== undefined
                      ? `${Number(stats.kpis.avgRating).toFixed(1)}/5`
                      : "0.0/5"
                  }
                  icon={
                    <Star
                      className={
                        stats?.kpis?.avgRating > 0
                          ? "text-amber-500"
                          : "text-slate-300"
                      }
                    />
                  }
                  /* Dynamically show review count */
                  trend={
                    stats?.kpis?.reviewCount !== undefined
                      ? `${stats.kpis.reviewCount} ${t`Reviews`}`
                      : t`No Reviews`
                  }
                  color="amber"
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Area Chart: Monthly Inquiries */}
                <div className="luxury-surface relative overflow-hidden rounded-[2rem] p-8 lg:col-span-2">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold text-lg flex items-center gap-2 italic">
                      <TrendingUp size={20} className="text-blue-500" /> Monthly
                      Growth
                    </h3>
                    <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-3 py-1 rounded-full uppercase tracking-tighter">
                      Visit Inquiries
                    </span>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.visitTrends}>
                        <defs>
                          <linearGradient
                            id="colorCount"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#3b82f6"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#3b82f6"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="_id"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fontWeight: "bold" }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "20px",
                            border: "none",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#3b82f6"
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorCount)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 🥧 INVENTORY VALUE (ENHANCED) */}
                <div className="luxury-surface rounded-[2rem] p-8">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <PieIcon size={20} className="text-emerald-500" /> Asset
                    Value
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.inventoryValue}
                          dataKey="total"
                          nameKey="_id"
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          paddingAngle={8}
                        >
                          {stats.inventoryValue?.map((e, i) => (
                            <Cell
                              key={i}
                              fill={e._id === "Sold" ? "#ef4444" : "#10b981"}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {stats.inventoryValue.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-sm font-bold"
                      >
                        <span className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${item._id === "Sold" ? "bg-red-500" : "bg-emerald-500"}`}
                          />
                          {item._id}
                        </span>
                        <span className="dark:text-white">
                          ₹{item.total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bar Chart: Property Views */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <Eye size={18} className="text-blue-500" />{" "}
                    {t`Popularity Analytics (Views)`}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* LEFT: Bar Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.topProperties} layout="vertical">
                          <XAxis type="number" hide />

                          <YAxis
                            dataKey="title"
                            type="category"
                            width={120}
                            tick={{ fontSize: 10, fontWeight: "bold" }}
                            axisLine={false}
                          />

                          <Tooltip formatter={(v) => [v, t`Views`]} />

                          <Bar
                            dataKey="views"
                            fill="#3b82f6"
                            radius={[0, 10, 10, 0]}
                            barSize={25}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* RIGHT: Top 4 Ranked Properties */}
                    <div className="space-y-3">
                      {stats.topProperties.slice(0, 4).map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-700"
                        >
                          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black">
                            {i + 1}
                          </div>

                          <div className="flex-1 overflow-hidden">
                            <p className="font-bold text-sm truncate dark:text-white">
                              {p.title}
                            </p>

                            <p className="text-xs text-blue-500 font-black uppercase tracking-tighter">
                              {p.views} {t`Total Views`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* NEW SECTION — Property Performance Insights */}
                  <div className="mt-8">
                    <h4 className="text-sm font-black uppercase text-slate-400 mb-4">
                      {t`Top Property Insights`}
                    </h4>

                    <div className="grid md:grid-cols-3 gap-4">
                      {stats.topProperties.slice(0, 3).map((p, i) => (
                        <div
                          key={i}
                          className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700"
                        >
                          <p className="font-bold text-sm dark:text-white truncate">
                            {p.title}
                          </p>

                          <p className="text-xs text-blue-500 font-bold mt-1">
                            {p.views} Views
                          </p>

                          <p className="text-xs text-green-600 font-bold mt-1">
                            ₹{p.price?.toLocaleString?.() || 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ADD PROPERTY VIEW */}
          {activeTab === "add" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto max-w-4xl rounded-3xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 md:p-8"
            >
              <h2 className="mb-6 text-xl font-black tracking-tight italic sm:mb-8 sm:text-2xl">
                {t`Publish Property`}
              </h2>

              <form
                onSubmit={handleSubmit}
                className="grid gap-4 sm:gap-6 md:grid-cols-2"
              >
                {/* TITLE */}
                <FormInput
                  label={t`Title`}
                  placeholder={t`Luxurious 3BHK in Downtown`}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />

                {/* PRICE */}
                <div className="space-y-1">
                  <FormInput
                    label={t`Price (₹)`}
                    placeholder={t`Enter price`}
                    value={formData.price}
                    type="number"
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                  {formData.price && (
                    <p className="text-xs text-green-600 font-bold">
                      ₹{Number(formData.price).toLocaleString()}
                    </p>
                  )}
                </div>

                <FormInput
                  label={t`Commission (%)`}
                  type="number"
                  placeholder="e.g. 2"
                  value={formData.commission || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, commission: e.target.value })
                  }
                />

                {/* AMENITIES */}
                <FormInput
                  label={t`Amenities (comma separated)`}
                  placeholder={t`Pool, Parking, Garden`}
                  value={formData.amenities || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, amenities: e.target.value })
                  }
                />

                {/* LOCATION BLOCK */}
                <div className="space-y-4 rounded-2xl border bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800 sm:p-6 md:col-span-2">
                  <p className="font-bold text-xs uppercase text-slate-400 tracking-widest">
                    {t`Location & Coordinates`}
                  </p>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      className="flex-1 p-4 rounded-xl border dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 ring-blue-500/20"
                      placeholder={t`Search Location...`}
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />

                    <button
                      type="button"
                      onClick={handleSearchAddress}
                      className="rounded-xl bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700 sm:py-0"
                    >
                      <Search size={20} />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <input
                      type="number"
                      step="any"
                      className="p-4 rounded-xl border dark:bg-slate-900 dark:border-slate-700 outline-none"
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          latitude: parseFloat(e.target.value) || 0,
                        })
                      }
                    />

                    <input
                      type="number"
                      step="any"
                      className="p-4 rounded-xl border dark:bg-slate-900 dark:border-slate-700 outline-none"
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          longitude: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <LocationPicker
                    selectedLocation={{
                      lat: formData.latitude,
                      lng: formData.longitude,
                    }}
                    onLocationSelect={handleMapPinSelect}
                  />
                </div>

                {/* SIZE */}
                <FormInput
                  className="flex-1 p-4 rounded-xl border dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 ring-blue-500/20"
                  label={t`Size (sqft/Acres)`}
                  placeholder={t`e.g. 1500 Sq Ft or 0.5 Acres`}
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                />

                {/* TYPE */}
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400">
                    {t`Type`}
                  </label>

                  <select
                    value={formData.propertyType}
                    className="w-full p-4 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    onChange={(e) =>
                      setFormData({ ...formData, propertyType: e.target.value })
                    }
                  >
                    <option value="Land">Land</option>
                    <option value="House">House</option>
                    <option value="Apartment">Apartment</option>
                  </select>
                </div>

                {/* DESCRIPTION */}
                <div className="md:col-span-2">
                  <textarea
                    value={formData.description}
                    rows="4"
                    maxLength="500"
                    className="w-full p-5 rounded-2xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none"
                    placeholder={t`Description`}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {formData.description?.length || 0}/500
                  </p>
                </div>

                {/* FEATURED TOGGLE */}
                <div className="flex items-center gap-3 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={formData.featured || false}
                    onChange={(e) =>
                      setFormData({ ...formData, featured: e.target.checked })
                    }
                  />
                  <span className="text-sm font-bold">{t`Featured Property`}</span>
                </div>

                {/* IMAGE UPLOAD */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative p-6 bg-slate-50 dark:bg-slate-800 border-2 border-dashed rounded-3xl text-center">
                    {editingListingId && <div className="mb-4 text-left"><p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Current photos — click × to remove</p><div className="flex flex-wrap gap-2">{retainedImages.map((url) => <div key={url} className="relative"><img src={url} alt="Current listing" className="h-14 w-14 rounded-lg object-cover"/><button type="button" onClick={() => setRetainedImages((items) => items.filter((item) => item !== url))} aria-label="Remove photo" className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-black text-white">×</button></div>)}</div></div>}
                    <label className="cursor-pointer flex flex-col items-center">
                      <Plus className="mb-1 text-slate-400" />
                      <span className="text-xs font-bold text-slate-500">
                        {t`Photos`}
                      </span>

                      <input
                        type="file"
                        ref={imageInputRef}
                        multiple
                        accept="image/*"
                        onChange={(e) => setImages(e.target.files)}
                        className="hidden"
                      />
                    </label>

                    {images?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 justify-center">
                        {Array.from(images).map((img, i) => (
                          <img
                            key={i}
                            src={URL.createObjectURL(img)}
                            alt=""
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* VIDEO UPLOAD */}
                  <div className="relative p-6 bg-slate-50 dark:bg-slate-800 border-2 border-dashed rounded-3xl text-center">
                    {editingListingId && <div className="mb-4 text-left"><p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Current videos — click × to remove</p><div className="flex flex-wrap gap-2">{retainedVideos.map((url) => <div key={url} className="relative"><video src={url} className="h-14 w-20 rounded-lg object-cover"/><button type="button" onClick={() => setRetainedVideos((items) => items.filter((item) => item !== url))} aria-label="Remove video" className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-black text-white">×</button></div>)}</div></div>}
                    <label className="cursor-pointer flex flex-col items-center">
                      <Video className="mb-1 text-slate-400" />
                      <span className="text-xs font-bold text-slate-500">
                        {t`Videos`}
                      </span>

                      <input
                        type="file"
                        ref={videoInputRef}
                        multiple
                        accept="video/*"
                        onChange={(e) => setVideos(e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* LIFECYCLE ACTIONS */}
                <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:flex-wrap">
                  <button type="button" onClick={() => setShowListingPreview(true)} className="rounded-xl border border-stone-300 px-5 py-3 text-sm font-black text-stone-700 dark:border-slate-600 dark:text-stone-200 sm:py-4">Preview</button>
                  <button type="submit" value="draft" disabled={isUploading} className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-black text-amber-800 disabled:opacity-50 dark:bg-amber-900/20 dark:text-amber-300 sm:py-4">{isUploading ? t`Uploading...` : "Save as Draft"}</button>
                  <button type="submit" value="published" disabled={isUploading} className="rounded-xl bg-blue-600 px-5 py-3 text-base font-black text-white transition-all hover:shadow-xl disabled:opacity-50 sm:flex-1 sm:py-4 sm:text-lg">{editingListingId && formData.lifecycle === "published" ? "Save Published Changes" : "Publish Property"}</button>
                  {editingListingId && <button type="submit" value="sold" disabled={isUploading} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50 sm:py-4">Mark Sold</button>}
                </div>
              </form>
            </motion.div>
          )}
          {showListingPreview && <div className="fixed inset-0 z-[1200] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-4"><div className="my-2 max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-[1.5rem] bg-[#fdfbf6] p-5 shadow-2xl dark:bg-slate-900 sm:my-4 sm:max-h-[calc(100dvh-2rem)] sm:rounded-[2rem] sm:p-8"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="editorial-label text-amber-700">Private preview</p><h2 className="display-face mt-2 break-words text-3xl font-bold dark:text-white sm:text-4xl">{formData.title || "Untitled property"}</h2></div><button type="button" onClick={() => setShowListingPreview(false)} className="shrink-0 rounded-full p-2 text-slate-500 hover:bg-stone-100 dark:hover:bg-slate-800"><X size={20}/></button></div>{retainedImages[0] && <img src={retainedImages[0]} alt="Property preview" className="mt-5 h-44 w-full rounded-2xl object-cover sm:mt-6 sm:h-56"/>}<div className="mt-5 grid gap-4 border-y border-stone-200 py-5 text-sm dark:border-slate-700 sm:mt-6 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Price</p><p className="mt-1 font-black dark:text-white">{formData.price ? `₹${Number(formData.price).toLocaleString("en-IN")}` : "Not set"}</p></div><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Location</p><p className="mt-1 break-words font-black dark:text-white">{formData.location || "Not set"}</p></div></div><p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">{formData.description || "Add a description to complete the property presentation."}</p><p className="mt-6 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">This preview is private. Use Publish Property when you are ready to make it visible to customers.</p></div></div>}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(115deg,#102c25,#1d5948_55%,#b88a45)] p-7 text-white shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">Customer operations</p><div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><h2 className="display-face text-4xl font-bold">Community command center</h2><p className="mt-2 max-w-xl text-sm text-emerald-50/80">Review customer health, engagement, and access from one place.</p></div><button className="flex w-fit items-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-xs font-black backdrop-blur hover:bg-white/25" onClick={exportUsersToCSV}><Download size={16}/> Export directory</button></div>
                <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4"><div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Total members</p><p className="mt-1 text-2xl font-black">{users.length}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Active access</p><p className="mt-1 text-2xl font-black">{activeUserCount}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Restricted</p><p className="mt-1 text-2xl font-black">{blockedUserCount}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Saved properties</p><p className="mt-1 text-2xl font-black">{totalSavedProperties}</p></div></div>
              </div>
              {/* Directory controls */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-sm">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{t`User Directory`}</h2>
                  <p className="text-slate-500 text-sm">{filteredUsers.length} of {users.length} members shown</p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto md:flex-1 md:justify-end">
                  <div className="relative w-full sm:flex-1 md:max-w-md lg:min-w-[26rem]">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder={t`Search by name or email...`}
                      className="pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl w-full border-none outline-none focus:ring-2 ring-blue-500/20"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <select value={userFilter} onChange={(event) => setUserFilter(event.target.value)} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold outline-none dark:bg-slate-800 dark:text-white"><option value="all">All members</option><option value="active">Active access</option><option value="blocked">Restricted</option><option value="admin">Administrators</option></select>
                  <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800"><button onClick={() => setUserDirectoryView("cards")} className={`rounded-xl px-3 py-2 text-xs font-black ${userDirectoryView === "cards" ? "bg-white text-emerald-800 shadow dark:bg-slate-700 dark:text-emerald-300" : "text-slate-500"}`}>Cards</button><button onClick={() => setUserDirectoryView("table")} className={`rounded-xl px-3 py-2 text-xs font-black ${userDirectoryView === "table" ? "bg-white text-emerald-800 shadow dark:bg-slate-700 dark:text-emerald-300" : "text-slate-500"}`}>Table</button></div>
                </div>
              </div>

              {/* Users Grid */}
              <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 ${userDirectoryView === "cards" ? "" : "hidden"}`}>
                {/* Change the mapping for users to include Account Age and Self-Protection */}
                {paginatedUsers.map((u) => {
                    // 🛡️ Self-Protection: Identify yourself (the master admin)
                    // Replace 'your-email@example.com' with your actual admin email
                    const isMasterAdmin = u.email?.toLowerCase() === "estatera.team@gmail.com";

                    return (
                      <motion.div
                        layout
                        key={u._id}
                        className={`relative group bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border transition-all hover:shadow-2xl hover:shadow-blue-500/10 ${u.isBlocked ? "border-red-200 bg-red-50/30" : "border-slate-100 dark:border-slate-800"}`}
                      >
                        <div className="flex items-center gap-4 mb-6">
                          <img
                            src={
                              u.image ||
                              `https://ui-avatars.com/api/?name=${u.name}&background=random`
                            }
                            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-800 shadow-lg"
                            alt=""
                          />
                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold dark:text-white truncate">
                                {u.name}
                              </h4>
                              {isMasterAdmin && (
                                <ShieldCheck
                                  size={16}
                                  className="text-blue-500"
                                />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                              {u.email}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6">
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] uppercase font-black text-slate-400 mb-1">
                              Engagement
                            </p>
                            <div className="flex items-center gap-2">
                              <Star size={12} className="text-amber-500" />
                              <span className="font-bold text-sm dark:text-white">
                                {u.favorites?.length || 0} Saved
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Joined</p>
                            <span className="text-[11px] font-black text-slate-700 dark:text-white">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}</span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] uppercase font-black text-slate-400 mb-1">
                              Status
                            </p>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${u.isBlocked ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}
                            >
                              {u.isBlocked ? "SUSPENDED" : "ACTIVE"}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {/* Only show buttons if the user is NOT the Master Admin */}
                          {!isMasterAdmin ? (
                            <>
                              <button
                                onClick={() => handleToggleBlock(u._id)}
                                className={`flex-1 py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                                  u.isBlocked
                                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                    : "bg-slate-900 text-white hover:bg-red-600"
                                }`}
                              >
                                {u.isBlocked ? (
                                  <UserCheck size={16} />
                                ) : (
                                  <UserX size={16} />
                                )}
                                {u.isBlocked ? "Restore User" : "Block Access"}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u._id)}
                                className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          ) : (
                            <div className="w-full py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-center rounded-2xl text-[10px] font-black uppercase tracking-tighter">
                              System Master (Protected)
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
              {userDirectoryView === "table" && <div className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-stone-50 text-[10px] font-black uppercase tracking-widest text-stone-500 dark:bg-slate-800"><tr><th className="px-5 py-4">Member</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Saved</th><th className="px-5 py-4">Joined</th><th className="px-5 py-4">Access</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-stone-100 dark:divide-slate-800">{paginatedUsers.map((user) => { const protectedAdmin = user.email?.toLowerCase() === "estatera.team@gmail.com"; return <tr key={user._id} className="hover:bg-stone-50/70 dark:hover:bg-slate-800/50"><td className="px-5 py-4"><div className="flex items-center gap-3"><img src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="" className="h-9 w-9 rounded-xl object-cover"/><div><p className="font-bold dark:text-white">{user.name}</p><p className="max-w-48 truncate text-xs text-slate-500">{user.email}</p></div></div></td><td className="px-5 py-4"><span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black uppercase dark:bg-slate-800 dark:text-slate-200">{user.role}</span></td><td className="px-5 py-4 font-bold dark:text-white">{user.favorites?.length || 0}</td><td className="px-5 py-4 text-xs text-slate-500">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "—"}</td><td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-black ${user.isBlocked ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>{user.isBlocked ? "Restricted" : "Active"}</span></td><td className="px-5 py-4 text-right">{protectedAdmin ? <span className="text-[10px] font-black text-blue-600">Protected</span> : <button onClick={() => handleToggleBlock(user._id)} className={`rounded-lg px-3 py-2 text-xs font-black ${user.isBlocked ? "bg-emerald-100 text-emerald-800" : "bg-slate-900 text-white"}`}>{user.isBlocked ? "Restore" : "Block"}</button>}</td></tr>; })}</tbody></table></div></div>}
              <div className="flex flex-wrap items-center justify-between gap-3 px-1"><p className="text-sm text-slate-500">Page {userPage} of {userTotalPages}</p><div className="flex gap-2"><button disabled={userPage === 1} onClick={() => setUserPage((page) => page - 1)} className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-black disabled:opacity-40 dark:border-slate-700">Previous</button><button disabled={userPage >= userTotalPages} onClick={() => setUserPage((page) => page + 1)} className="rounded-lg bg-emerald-950 px-4 py-2 text-xs font-black text-white disabled:opacity-40">Next</button></div></div>
            </div>
          )}

          {activeTab === "inquiries" && (
            <div className="space-y-6">
              <div>
                <p className="editorial-label text-amber-700">Contact desk</p>
                <h2 className="display-face mt-2 text-5xl font-bold">Incoming inquiries</h2>
                <p className="mt-2 text-sm text-slate-500">Track and close conversations started from the public contact page.</p>
              </div>
              {inquiries.length ? <div className="grid gap-4 lg:grid-cols-2">{inquiries.map((inquiry) => (
                <article key={inquiry._id} className="luxury-surface rounded-[1.5rem] p-6">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="font-black dark:text-white">{inquiry.name}</h3><p className="text-sm text-slate-500">{inquiry.email}</p></div><select value={inquiry.status} onChange={(event) => updateInquiry(inquiry._id, event.target.value)} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-800"><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select></div><p className="mt-5 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{inquiry.message}</p><p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{new Date(inquiry.date).toLocaleString()}</p>
                </article>
              ))}</div> : <div className="luxury-surface rounded-[1.5rem] p-10 text-center text-slate-500">No contact inquiries yet.</div>}
            </div>
          )}

          {/* 3. VISITS VIEW (Unchanged as requested) */}
          {activeTab === "visits" && (
            <div className="space-y-6">
              <section className="luxury-surface rounded-[1.5rem] p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="editorial-label text-amber-700">Appointment planner</p><h2 className="display-face mt-1 text-3xl font-bold dark:text-white">Visit calendar</h2></div><div className="flex rounded-xl bg-stone-100 p-1 dark:bg-slate-800"><button onClick={() => setVisitCalendarMode("month")} className={`rounded-lg px-3 py-2 text-xs font-black ${visitCalendarMode === "month" ? "bg-white shadow dark:bg-slate-700" : "text-slate-500"}`}>Month</button><button onClick={() => setVisitCalendarMode("week")} className={`rounded-lg px-3 py-2 text-xs font-black ${visitCalendarMode === "week" ? "bg-white shadow dark:bg-slate-700" : "text-slate-500"}`}>Week</button></div></div>
                <div className="mt-4 grid gap-3 md:grid-cols-3"><select value={visitStatusFilter} onChange={(e) => setVisitStatusFilter(e.target.value)} className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800"><option value="all">All statuses</option><option value="pending">Pending</option><option value="scheduled">Scheduled</option><option value="visited">Visited</option><option value="cancelled">Cancelled</option></select><select value={visitPropertyFilter} onChange={(e) => setVisitPropertyFilter(e.target.value)} className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800"><option value="all">All properties</option>{calendarProperties.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select><select value={visitAgentFilter} onChange={(e) => setVisitAgentFilter(e.target.value)} className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800"><option value="all">All team members</option>{calendarAgents.map((agent) => <option key={agent} value={agent}>{agent}</option>)}</select></div>
                <VisitCalendar mode={visitCalendarMode} date={calendarDate} visits={scheduledVisits} onPrevious={() => setCalendarDate((date) => visitCalendarMode === "month" ? new Date(date.getFullYear(), date.getMonth() - 1, 1) : new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7))} onNext={() => setCalendarDate((date) => visitCalendarMode === "month" ? new Date(date.getFullYear(), date.getMonth() + 1, 1) : new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7))} onDrop={(visit, nextDate) => updateVisitStatus(visit._id, "scheduled", nextDate.toISOString().slice(0, 16), visit.adminNote || "", true, visit.assignedAgent || "")} />
                <p className="mt-3 text-xs text-slate-500">Drag a scheduled appointment onto another date to reschedule and notify the customer.</p>
              </section>
              <div className="grid md:grid-cols-2 gap-4">
              {visits.map((v) => (
                <div
                  key={v._id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-lg dark:text-white">
                        {v.name}
                      </h4>
                      <p className="text-blue-600 font-bold text-xs mb-2">
                        {v.propertyId?.title}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2">
                        <Users size={12} /> {v.email}
                      </p>
                      <p className="text-[11px] text-blue-600 font-black flex items-center gap-2 mt-1">
                        <Phone size={12} /> {v.phone || "N/A"}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${v.status === "scheduled" ? "bg-blue-100 text-blue-600" : "bg-slate-100"}
                      ${v.status === "visited" ? "bg-green-100 text-green-600" : "bg-slate-100 dark:bg-slate-800"}
                      ${v.status === "cancelled" ? "bg-red-100 text-red-600" : "bg-slate-100 dark:bg-slate-800"}`}
                    >
                      {v.status}
                    </span>
                  </div>
                  <select
                    value={v.status}
                    onChange={(e) => updateVisitStatus(v._id, e.target.value, v.scheduledFor ? new Date(v.scheduledFor).toISOString().slice(0, 16) : "", v.adminNote || "")}
                    className="w-full p-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black font-bold outline-none cursor-pointer mt-2 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="visited">Visited</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <label className="mt-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">Customer appointment date & time</label>
                  <input type="datetime-local" defaultValue={v.scheduledFor ? new Date(v.scheduledFor).toISOString().slice(0, 16) : ""} onBlur={(e) => { if (e.target.value) updateVisitStatus(v._id, "scheduled", e.target.value, v.adminNote || "", true); }} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
                  <p className="mt-1 text-[10px] leading-4 text-slate-400">Saving a time changes this request to Scheduled and notifies the customer.</p>
                  {v.status === "scheduled" && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-900/10"><p className="text-xs font-bold text-amber-800 dark:text-amber-300">Has the property visit happened?</p>{visitCheckId === v._id ? <div className="mt-3 flex gap-2"><button onClick={() => { updateVisitStatus(v._id, "visited", v.scheduledFor ? new Date(v.scheduledFor).toISOString().slice(0, 16) : "", v.adminNote || "", true); setVisitCheckId(null); }} aria-label="Mark visit as completed" className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-xl font-black text-white">✓</button><button onClick={() => setVisitCheckId(null)} aria-label="Keep visit scheduled" className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-200 text-xl font-black text-stone-700 dark:bg-slate-700 dark:text-stone-100">✕</button><span className="self-center text-[11px] text-amber-700 dark:text-amber-300">✓ marks Visited · ✕ keeps Scheduled</span></div> : <button onClick={() => setVisitCheckId(v._id)} className="mt-2 text-xs font-black text-amber-800 underline underline-offset-4 dark:text-amber-300">Confirm visit outcome</button>}</div>}
                  <label className="mt-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned team member</label>
                  <input defaultValue={v.assignedAgent || ""} onBlur={(e) => updateVisitStatus(v._id, v.status, v.scheduledFor ? new Date(v.scheduledFor).toISOString().slice(0, 16) : "", v.adminNote || "", false, e.target.value)} placeholder="e.g. Priya" className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
                  <label className="mt-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">Private note</label>
                  <textarea defaultValue={v.adminNote || ""} onBlur={(e) => updateVisitStatus(v._id, v.status, v.scheduledFor ? new Date(v.scheduledFor).toISOString().slice(0, 16) : "", e.target.value, false)} rows="2" placeholder="Internal note for the team" className="mt-1 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800" />
                </div>
              ))}
              </div>
            </div>
          )}

          {/* 4. INVENTORY VIEW (Unchanged as requested) */}
          {activeTab === "manage" && (
            <div className="space-y-5">
              <div className="luxury-surface rounded-[1.5rem] p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={inventorySearch} onChange={(e) => { setInventorySearch(e.target.value); setInventoryPage(1); }} placeholder="Search property or location" className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-sm outline-none ring-emerald-800/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"/></div><select value={inventoryStatus} onChange={(e) => { setInventoryStatus(e.target.value); setInventoryPage(1); }} className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-800"><option value="all">All statuses</option><option value="Available">Available</option><option value="Sold">Sold</option></select><select value={inventoryType} onChange={(e) => { setInventoryType(e.target.value); setInventoryPage(1); }} className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-800"><option value="all">All types</option><option value="Land">Land</option><option value="House">House</option><option value="Apartment">Apartment</option></select><select value={inventoryLifecycle} onChange={(e) => { setInventoryLifecycle(e.target.value); setInventoryPage(1); }} className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-800"><option value="all">All lifecycle stages</option><option value="draft">Draft</option><option value="published">Published</option><option value="sold">Sold</option></select><select value={inventoryArchived} onChange={(e) => { setInventoryArchived(e.target.value); setInventoryPage(1); setSelectedListingIds([]); }} className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-800"><option value="false">Active inventory</option><option value="true">Archived</option><option value="all">All records</option></select></div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4 text-sm dark:border-slate-700"><label className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={filteredInventory.length > 0 && selectedListingIds.length === filteredInventory.length} onChange={(e) => setSelectedListingIds(e.target.checked ? filteredInventory.map((item) => item._id) : [])}/> Select page ({filteredInventory.length})</label><span className="text-xs font-bold text-slate-500">{inventoryMeta.total} properties</span>{selectedListingIds.length > 0 && <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-500">{selectedListingIds.length} selected</span><button onClick={() => bulkSetListingStatus("Available")} className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Mark Available</button><button onClick={() => bulkSetListingStatus("Sold")} className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-black text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Mark Sold</button><button onClick={bulkArchive} className="rounded-lg bg-red-100 px-3 py-2 text-xs font-black text-red-700 dark:bg-red-900/30 dark:text-red-300">Archive</button></div>}</div>
              </div>
              {filteredInventory.length ? <><div className="grid grid-cols-1 gap-4">{filteredInventory.map((item) => (
                <div
                  key={item._id}
                  className="overflow-hidden rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-4 overflow-hidden">
                    <input aria-label={`Select ${item.title}`} type="checkbox" checked={selectedListingIds.includes(item._id)} onChange={() => toggleListingSelection(item._id)} className="mt-1 h-4 w-4 shrink-0 accent-emerald-800" />
                    <img
                      src={item.images?.[0] || "https://placehold.co/160x160/e7e5e4/57534e?text=Estatera"}
                      className="h-24 w-24 shrink-0 rounded-xl object-cover md:h-16 md:w-16"
                      alt={item.title}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold truncate dark:text-white">
                        {item.title}
                      </h4>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500"><span className="rounded-md bg-stone-100 px-2 py-1 dark:bg-slate-800">{item.propertyType}</span><span className="rounded-md bg-stone-100 px-2 py-1 dark:bg-slate-800">{item.size}</span><span className="max-w-32 truncate rounded-md bg-stone-100 px-2 py-1 dark:bg-slate-800">{item.location}</span></div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.lifecycle || "published"}{item.publishedAt ? ` · Published ${new Date(item.publishedAt).toLocaleDateString()}` : ""}{item.unpublishedAt ? ` · Unpublished ${new Date(item.unpublishedAt).toLocaleDateString()}` : ""}</p>
                      <p className="text-xs text-blue-600 font-black">
                        ₹{item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4 dark:border-slate-800 md:mt-0 md:border-0 md:pt-0">
                    {!item.isArchived && item.lifecycle !== "draft" && <button
                      onClick={() => toggleStatus(item._id, item.status)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${item.status === "Sold" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
                    >
                      {item.status}
                    </button>}
                    {!item.isArchived && item.lifecycle !== "published" && <button onClick={() => setListingLifecycle(item._id, "published")} className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-black text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Publish</button>}
                    {!item.isArchived && item.lifecycle === "published" && <button onClick={() => setListingLifecycle(item._id, "draft")} className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-black text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Unpublish</button>}
                    {!item.isArchived && <button onClick={() => beginListingEdit(item)} className="px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300">Edit</button>}
                    {item.isArchived ? <button onClick={() => restoreListing(item._id)} className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Restore</button> : <button onClick={() => handleDelete(item._id)} aria-label={`Archive ${item.title}`} className="p-2 text-slate-400 transition-colors hover:text-red-500"><Trash2 size={20} /></button>}
                  </div>
                </div>
              ))}</div><div className="mt-6 flex items-center justify-between"><p className="text-sm text-slate-500">Page {inventoryPage} of {inventoryMeta.totalPages}</p><div className="flex gap-2"><button disabled={inventoryPage === 1} onClick={() => setInventoryPage((page) => page - 1)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700">Previous</button><button disabled={inventoryPage >= inventoryMeta.totalPages} onClick={() => setInventoryPage((page) => page + 1)} className="rounded-lg bg-emerald-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div></> : <div className="luxury-surface rounded-[1.5rem] p-12 text-center text-slate-500">No properties match these inventory filters.</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SideBtn({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full p-4 rounded-2xl transition-all ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:bg-slate-800/50"}`}
    >
      <span className="mr-4">{icon}</span>
      <span className="font-bold text-sm tracking-wide">{label}</span>
    </button>
  );
}

function VisitCalendar({ mode, date, visits, onPrevious, onNext, onDrop }) {
  const start = mode === "month"
    ? new Date(date.getFullYear(), date.getMonth(), 1 - new Date(date.getFullYear(), date.getMonth(), 1).getDay())
    : new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
  const days = Array.from({ length: mode === "month" ? 42 : 7 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  const sameDay = (first, second) => first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
  const moveVisit = (event, day) => {
    event.preventDefault();
    const visit = visits.find((item) => item._id === event.dataTransfer.getData("visitId"));
    if (!visit) return;
    const oldTime = new Date(visit.scheduledFor);
    const nextDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), oldTime.getHours(), oldTime.getMinutes());
    onDrop(visit, nextDate);
  };

  return <div className="mt-5 overflow-x-auto">
    <div className="mb-3 flex items-center justify-between"><button onClick={onPrevious} aria-label="Previous period" className="rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-slate-800"><ChevronLeft size={18}/></button><p className="font-black dark:text-white">{date.toLocaleString("en-IN", { month: "long", year: "numeric" })}</p><button onClick={onNext} aria-label="Next period" className="rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-slate-800"><ChevronRight size={18}/></button></div>
    <div className="grid min-w-[46rem] grid-cols-7 border-l border-t border-stone-200 dark:border-slate-700">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => <div key={label} className="border-b border-r border-stone-200 bg-stone-50 p-2 text-center text-[10px] font-black uppercase tracking-widest text-stone-500 dark:border-slate-700 dark:bg-slate-800">{label}</div>)}{days.map((day) => { const dayVisits = visits.filter((visit) => sameDay(new Date(visit.scheduledFor), day)); const outsideMonth = mode === "month" && day.getMonth() !== date.getMonth(); return <div key={day.toISOString()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => moveVisit(event, day)} className={`min-h-28 border-b border-r border-stone-200 p-2 dark:border-slate-700 ${outsideMonth ? "bg-stone-50/60 text-stone-400 dark:bg-slate-900/30" : "bg-white dark:bg-slate-900"}`}><p className={`mb-2 text-xs font-black ${sameDay(day, new Date()) ? "text-emerald-700 dark:text-emerald-300" : ""}`}>{day.getDate()}</p><div className="space-y-1">{dayVisits.map((visit) => <div key={visit._id} draggable={visit.status === "scheduled"} onDragStart={(event) => event.dataTransfer.setData("visitId", visit._id)} title={`${visit.name} — ${visit.propertyId?.title || "Property"}`} className={`truncate rounded px-2 py-1 text-[10px] font-bold ${visit.status === "scheduled" ? "cursor-grab bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" : "bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-slate-300"}`}>{new Date(visit.scheduledFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {visit.propertyId?.title || visit.name}</div>)}</div></div>; })}</div>
  </div>;
}

function KPICard({ title, value, icon, trend, color }) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    purple: "bg-purple-100 text-purple-600",
    amber: "bg-amber-100 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="luxury-surface rounded-3xl p-6 transition-all hover:-translate-y-0.5">
      <div className="flex justify-between items-start mb-4">
        {/* Dynamic color background for icon */}
        <div className={`p-3 rounded-2xl ${colorMap[color] || colorMap.slate}`}>
          {icon}
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
          {trend}
        </div>
      </div>
      <h4 className="text-slate-500 font-bold text-xs uppercase tracking-tighter">
        {title}
      </h4>
      <p className="text-2xl font-black mt-1 dark:text-white tracking-tight">
        {value}
      </p>
    </div>
  );
}

function FormInput({ label, value, type = "text", onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black uppercase text-slate-400 ml-1">
        {label}
      </label>
      <input
        value={value}
        type={type}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-4 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 ring-blue-500/20"
      />
    </div>
  );
}
