import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  MapPin,
  Ruler,
  Building,
  ArrowLeft,
  Share2,
  Heart,
  ShieldCheck,
  Calculator,
  Phone,
  MessageCircle,
  FileText,
  Download,
  Scale,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import StatePanel from "../components/common/StatePanel";
import PropertyCard from "../components/PropertyCard";
import Seo, { siteUrl } from "../components/Seo";
import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";

export default function PropertyDetails() {
  useLingui();
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [phone, setPhone] = useState("");
  const [liked, setLiked] = useState(false);
  const [relatedProperties, setRelatedProperties] = useState([]);
  const [isCompared, setIsCompared] = useState(false);
  const { user, updateWishlist } = useAuth();

  // EMI Calculator State
  const [loanAmount, setLoanAmount] = useState(0);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  useEffect(() => {
    // Fetch Property Data
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/listings/${id}`)
      .then((res) => {
        setProperty(res.data);
        setLoanAmount(res.data.price);
        setLoading(false);
        setLiked(res.data.liked || false);
        setIsCompared(JSON.parse(localStorage.getItem("propertyComparison") || "[]").includes(res.data._id));
        try {
          const history = JSON.parse(localStorage.getItem("recentlyViewedProperties") || "[]").filter((entry) => entry.id !== res.data._id);
          localStorage.setItem("recentlyViewedProperties", JSON.stringify([{ id: res.data._id, viewedAt: Date.now() }, ...history].slice(0, 12)));
        } catch (_) { /* Local history is optional. */ }
        axios.get(`${import.meta.env.VITE_API_URL}/api/listings`).then(({ data }) => {
          const others = data.filter((listing) => listing._id !== res.data._id);
          const locationWord = res.data.location?.split(",")[0]?.trim().toLowerCase();
          const related = others.filter((listing) => listing.propertyType === res.data.propertyType || (locationWord && listing.location?.toLowerCase().includes(locationWord)));
          setRelatedProperties((related.length ? related : others).slice(0, 3));
        }).catch(() => setRelatedProperties([]));
      })
      .catch((err) => console.error(err));

    // View Incrementer (Runs only once)
    if (!viewTracked.current) {
      viewTracked.current = true;

      const sessionKey = `v_${id}`;
      if (!sessionStorage.getItem(sessionKey)) {
        axios
          .patch(`${import.meta.env.VITE_API_URL}/api/listings/${id}/view`)
          .then(() => sessionStorage.setItem(sessionKey, "true"))
          .catch((err) => console.error("Analytics Error:", err));
      }
    }
  }, [id]);

  const isFavorite = user?.user?.favorites?.includes(property?._id);
  const toggleCompare = () => {
    const ids = JSON.parse(localStorage.getItem("propertyComparison") || "[]");
    if (ids.includes(property._id)) { localStorage.setItem("propertyComparison", JSON.stringify(ids.filter((item) => item !== property._id))); setIsCompared(false); return toast.success("Removed from comparison."); }
    if (ids.length >= 3) return toast.error("You can compare up to three properties.");
    localStorage.setItem("propertyComparison", JSON.stringify([...ids, property._id])); setIsCompared(true); toast.success("Added to your comparison.");
  };

  const toggleFavorite = async () => {
    if (!user) return alert(t`Account created! Please login.`);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/favorites/toggle`,
        {
          userId: user.user?.id,
          propertyId: property?._id,
        },
      );

      updateWishlist(res.data.favorites);
    } catch (err) {
      console.error(err);
    }
  };

  const viewTracked = useRef(false);

  const emiDetails = useMemo(() => {
    const P = loanAmount;
    const R = interestRate / 12 / 100;
    const N = tenure * 12;
    const emiCalc = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    return {
      monthlyEmi: emiCalc || 0,
      totalInterest: emiCalc * N - P || 0,
      totalPayment: emiCalc * N || 0,
    };
  }, [loanAmount, interestRate, tenure]);

  const handleRequestVisit = async (e) => {
    e.preventDefault();
    if (!user)
      return toast.error(t`Please login to request a visit.`, { icon: "🔒" });
    if (!phone) return toast.error(t`Please enter your mobile number.`);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/visits`, {
        propertyId: id,
        userId: user.user.id,
        name: user.user.name,
        email: user.user.email,
        phone: phone,
      });
      toast.success(t`Visit request sent! We will contact you soon.`, {
        duration: 6000,
        icon: "📅",
        style: { border: "2px solid #2563eb", padding: "16px" },
      });
      setPhone("");
    } catch (err) {
      toast.error(t`Failed to send visit request, Try again`, { icon: "❌" });
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!property)
    return <div className="px-5 py-24"><StatePanel type="error" title={t`Property not found`} message={t`This property may no longer be available, or the link may be incomplete.`} actionTo="/listings" actionLabel={t`Explore properties`} /></div>;

  const mediaList = [
    ...(property.videos?.[0] ? [property.videos[0]] : []),
    ...(property.images || []),
  ];

  // Helper to convert image URL to Base64 (Essential for jsPDF)
  const getBase64ImageFromURL = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };
      img.onerror = (error) => reject(error);
      img.src = url;
    });
  };

  const downloadBrochure = async () => {
    const toastId = toast.loading(t`Generating high-quality brochure...`);
    try {
      const doc = new jsPDF();
      const brandColor = [37, 99, 235]; // #2563eb

      // --- 1. HEADER & BRANDING ---
      doc.setFillColor(...brandColor);
      doc.rect(0, 0, 210, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("ESTATERA", 15, 25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("PREMIUM REAL ESTATE BROCHURE", 15, 33);
      doc.text(new Date().toLocaleDateString(), 180, 25, { align: "right" });

      // --- 2. MAIN IMAGE ---
      if (property.images?.[0]) {
        try {
          const imgData = await getBase64ImageFromURL(property.images[0]);
          // Aspect ratio calculation to fit width
          const imgWidth = 180;
          const imgHeight = 100;
          doc.addImage(
            imgData,
            "PNG",
            15,
            50,
            imgWidth,
            imgHeight,
            undefined,
            "FAST",
          );
        } catch (e) {
          console.error("Image PDF error", e);
        }
      }

      // --- 3. PROPERTY TITLE & PRICE ---
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(property.title, 15, 165);

      doc.setTextColor(...brandColor);
      doc.setFontSize(18);
      doc.text(`INR ${property.price.toLocaleString()}`, 15, 175);

      // --- 4. KEY DETAILS TABLE ---
      autoTable(doc, {
        startY: 185,
        head: [[t`Location`, t`Property Type`, t`Size`]],
        body: [[property.location, property.propertyType, property.size]],
        theme: "plain",
        headStyles: {
          textColor: [100, 100, 100],
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: { fontSize: 11, textColor: [0, 0, 0], fontStyle: "bold" },
        margin: { left: 15 },
      });

      // --- 5. DESCRIPTION ---
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(t`DESCRIPTION`, 15, doc.lastAutoTable.finalY + 10);

      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      const splitDesc = doc.splitTextToSize(property.description, 180);
      doc.text(splitDesc, 15, doc.lastAutoTable.finalY + 17);

      // --- 6. AMENITIES ---
      if (property.amenities?.length > 0) {
        const yPos = doc.lastAutoTable.finalY + 50;
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(t`\n\nPREMIUM AMENITIES\n`, 15, yPos);

        doc.setTextColor(...brandColor);
        doc.text(t`\n\n${property.amenities.join("  •  ")}\n`, 15, yPos + 7);
      }

      // --- 7. FOOTER ---
      doc.setDrawColor(230, 230, 230);
      doc.line(15, 275, 195, 275);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        t`Contact us at support@estatera@gmail.com for more information regarding this property.`,
        105,
        282,
        { align: "center" },
      );

      doc.save(`${property.title.replace(/\s+/g, "_")}_Brochure.pdf`);
      toast.success(t`Brochure downloaded!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(t`Failed to generate PDF`, { id: toastId });
    }
  };

  const downloadPremiumBrochure = async () => {
    const toastId = toast.loading("Preparing your property presentation...");
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const ink = [13, 44, 36], gold = [184, 138, 69], paper = [253, 251, 246], muted = [95, 107, 101];
      const price = "Private pricing on request";
      let imageData = null;
      if (property.images?.[0]) { try { imageData = await getBase64ImageFromURL(property.images[0]); } catch (error) { console.warn("Brochure image unavailable", error); } }

      // Page one — private presentation cover
      doc.setFillColor(...paper); doc.rect(0, 0, 210, 297, "F");
      doc.setFillColor(...ink); doc.rect(0, 0, 210, 22, "F");
      doc.setTextColor(230, 203, 154); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("ESTATERA  /  PRIVATE COLLECTION", 15, 13);
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.text("PROPERTY PRESENTATION", 195, 13, { align: "right" });
      if (imageData) doc.addImage(imageData, "PNG", 0, 22, 210, 126, undefined, "FAST"); else { doc.setFillColor(221, 226, 217); doc.rect(0, 22, 210, 126, "F"); }
      doc.setFillColor(...ink); doc.rect(0, 148, 210, 5, "F");
      doc.setTextColor(...gold); doc.setFontSize(8); doc.text((property.propertyType || "PROPERTY").toUpperCase(), 15, 169);
      doc.setTextColor(...ink); doc.setFontSize(27); doc.setFont("helvetica", "bold"); const titleLines = doc.splitTextToSize(property.title || "Untitled property", 175); doc.text(titleLines, 15, 182);
      const titleHeight = titleLines.length * 10;
      doc.setTextColor(...muted); doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.text(property.location || "Location on request", 15, 188 + titleHeight);
      doc.setFillColor(237, 232, 220); doc.roundedRect(15, 205 + titleHeight, 180, 28, 3, 3, "F");
      doc.setTextColor(...muted); doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.text("GUIDE PRICE", 22, 215 + titleHeight); doc.text("PROPERTY SIZE", 82, 215 + titleHeight); doc.text("STATUS", 142, 215 + titleHeight);
      doc.setTextColor(...ink); doc.setFontSize(13); doc.text(price, 22, 225 + titleHeight); doc.text(property.size || "—", 82, 225 + titleHeight); doc.text(property.status || "Available", 142, 225 + titleHeight);
      doc.setTextColor(...muted); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text(`Prepared ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, 15, 279); doc.text("ESTATERA  ·  CONFIDENTIAL PRESENTATION", 195, 279, { align: "right" });

      // Page two — detail sheet
      doc.addPage(); doc.setFillColor(...paper); doc.rect(0, 0, 210, 297, "F"); doc.setFillColor(...ink); doc.rect(0, 0, 210, 16, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("ESTATERA", 15, 10); doc.setFontSize(7); doc.text("PROPERTY DETAILS", 195, 10, { align: "right" });
      doc.setTextColor(...gold); doc.setFontSize(8); doc.text("THE OPPORTUNITY", 15, 32); doc.setTextColor(...ink); doc.setFontSize(19); doc.text("A considered introduction.", 15, 43);
      doc.setTextColor(...muted); doc.setFont("helvetica", "normal"); doc.setFontSize(10); const description = doc.splitTextToSize(property.description || "Details available on request.", 180); doc.text(description, 15, 54);
      const descriptionEnd = 54 + description.length * 5;
      doc.setTextColor(...gold); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("PROPERTY SPECIFICATION", 15, descriptionEnd + 15);
      autoTable(doc, { startY: descriptionEnd + 20, body: [["Location", property.location || "—"], ["Property type", property.propertyType || "—"], ["Size", property.size || "—"], ["Commercial guidance", price], ["Availability", property.status || "Available"]], theme: "plain", styles: { fontSize: 10, cellPadding: 4, textColor: ink }, columnStyles: { 0: { fontStyle: "bold", textColor: muted, cellWidth: 55 }, 1: { cellWidth: 125 } }, alternateRowStyles: { fillColor: [244, 241, 233] }, margin: { left: 15, right: 15 } });
      const amenitiesY = doc.lastAutoTable.finalY + 17; doc.setTextColor(...gold); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("FEATURES & AMENITIES", 15, amenitiesY);
      doc.setTextColor(...ink); doc.setFontSize(10); const amenities = property.amenities?.length ? property.amenities.map((item) => `• ${item}`).join("     ") : "• Verified property details     • Private viewing available"; doc.text(doc.splitTextToSize(amenities, 180), 15, amenitiesY + 9);
      doc.setFillColor(...ink); doc.roundedRect(15, 239, 180, 31, 3, 3, "F"); doc.setTextColor(230, 203, 154); doc.setFontSize(8); doc.text("PRIVATE VIEWING", 23, 250); doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.text("Arrange a conversation with Estatera", 23, 260); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text("estatera.team@gmail.com  ·  Explore and request a visit online", 23, 266);
      doc.setDrawColor(220, 222, 216); doc.line(15, 282, 195, 282); doc.setTextColor(...muted); doc.setFontSize(7); doc.text("ESTATERA REALTY GROUP  ·  CHENNAI, TAMIL NADU", 15, 288); doc.text("PAGE 2 OF 2", 195, 288, { align: "right" });
      doc.save(`${property.title.replace(/\s+/g, "_")}_Estatera_Presentation.pdf`);
      toast.success("Premium brochure downloaded.", { id: toastId });
    } catch (error) { console.error(error); toast.error("Failed to generate brochure.", { id: toastId }); }
  };

  const propertyPath = `/property/${property._id}`;
  const propertyDescription = `${property.title} — verified ${property.propertyType?.toLowerCase() || "property"} in ${property.location}. ${property.size ? `${property.size}. ` : ""}${property.description?.slice(0, 120) || "Explore details and request a viewing."}`;
  const propertySchema = { "@context": "https://schema.org", "@type": "Product", name: property.title, description: property.description, image: property.images?.[0], url: `${siteUrl}${propertyPath}`, category: property.propertyType, offers: { "@type": "Offer", availability: property.status === "Sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock", url: `${siteUrl}${propertyPath}` }, address: { "@type": "PostalAddress", addressLocality: property.location, addressCountry: "IN" } };

  return <>
    <Seo title={property.title} description={propertyDescription} path={propertyPath} image={property.images?.[0] || `${siteUrl}/og-whatsapp.png`} type="product" schema={propertySchema} />
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 transition-colors"
      style={{ background: "var(--canvas)" }}
    >
      {/* 1. FULL SCREEN OVERLAY (Shows only when clicking an image) */}
      <AnimatePresence>
        {showAllPhotos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 flex justify-between items-center z-10">
              <button
                onClick={() => setShowAllPhotos(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft />
              </button>
              <h2 className="font-bold dark:text-white">
                {t`Media`} ({mediaList.length})
              </h2>
              <div className="w-10" />
            </div>
            {/* Simple vertical list for "View All" mode */}
            <div className="max-w-3xl mx-auto p-4 space-y-4">
              {mediaList.map((m, i) =>
                i === 0 && property.videos?.[0] ? (
                  <video
                    key={i}
                    src={m}
                    controls
                    className="w-full rounded-2xl"
                  />
                ) : (
                  <img key={i} src={m} className="w-full rounded-2xl" alt="" />
                ),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. TOP NAVIGATION BAR */}
      <div className="mx-auto flex max-w-[76rem] items-center justify-between px-5 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
        >
          <ArrowLeft size={20} /> {t`Back`}
        </button>
        <div className="flex gap-2">
          <button
            onClick={downloadPremiumBrochure}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-full shadow-md hover:bg-blue-50 dark:hover:bg-slate-700 transition-all font-bold text-sm"
          >
            <FileText size={18} className="text-blue-600" />
            <span className="hidden md:inline">{t`Brochure`}</span>
          </button>

          <button
            onClick={() =>
              navigator.share
                ? navigator.share({
                    title: property.title,
                    url: window.location.href,
                  })
                : navigator.clipboard.writeText(window.location.href)
            }
            className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors dark:text-white"
          >
            <Share2 size={20} />
          </button>
          <button onClick={toggleCompare} aria-label="Add property to comparison" className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold transition ${isCompared ? "bg-emerald-950 text-white" : "hover:bg-white dark:hover:bg-slate-800 dark:text-white"}`}><Scale size={19}/><span className="hidden md:inline">{isCompared ? "Comparing" : "Compare"}</span></button>
          <button
            onClick={toggleFavorite}
            className="p-3 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-lg transition hover:scale-110"
          >
            <Heart
              size={22}
              fill={isFavorite ? "#ef4444" : "none"}
              className={
                isFavorite
                  ? "text-red-500"
                  : "text-slate-600 dark:text-slate-300"
              }
            />
          </button>
        </div>
      </div>

      {/* 3. MAIN MEDIA GALLERY (FIXED HERE) */}
      <div className="max-w-7xl mx-auto md:px-4 mb-8">
        {/* 📱 MOBILE VIEW: Horizontal Swipe Gallery (Visible on Mobile Only) */}
        <div className="block md:hidden px-4">
          <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 pb-2">
            {mediaList.map((m, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[85vw] aspect-[4/3] rounded-3xl overflow-hidden snap-center shadow-lg border dark:border-slate-800 relative"
                onClick={() => setShowAllPhotos(true)}
              >
                {i === 0 && property.videos?.[0] ? (
                  <video
                    src={m}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img src={m} className="w-full h-full object-cover" alt="" />
                )}
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-bold">
                  {i + 1} / {mediaList.length}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest animate-pulse">
            {t`Swipe to explore`}
          </p>
        </div>

        {/* 💻 DESKTOP VIEW: Bento Grid (Visible on Desktop Only) */}
        <div
          className="hidden md:grid grid-cols-4 grid-rows-2 gap-3 h-[520px] rounded-[2rem] overflow-hidden shadow-2xl relative cursor-pointer"
          onClick={() => setShowAllPhotos(true)}
        >
          {mediaList.slice(0, 5).map((m, i) => (
            <div
              key={i}
              className={`overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""}`}
            >
              {i === 0 && property.videos?.[0] ? (
                <video
                  src={m}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={m}
                  className="w-full h-full object-cover hover:scale-105 transition duration-700"
                  alt=""
                />
              )}
            </div>
          ))}
          <div className="absolute bottom-6 right-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 dark:text-white">
            <ShieldCheck size={18} className="text-blue-600" />
            {t`View All Media`}
          </div>
        </div>
      </div>

      {/* 4. CONTENT GRID (Details & Sidebar) */}
      <div className="mx-auto grid max-w-[76rem] grid-cols-1 gap-10 px-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Title and stats */}
          <div className="mb-8">
            <p className="editorial-label mb-3 text-amber-700 dark:text-amber-400">Private collection · {property.propertyType}</p>
            <h1 className="display-face mb-3 text-5xl font-bold text-slate-900 dark:text-white md:text-6xl">
              {property.title}
            </h1>
            <p className="flex items-center text-slate-500">
              <MapPin size={20} className="mr-2 text-blue-600" />{" "}
              {property.location}
            </p>
          </div>

          <div className="flex gap-4 py-6 border-y dark:border-slate-800 mb-8 overflow-x-auto">
            <Feature icon={<Ruler />} label={t`Size`} value={property.size} />
            <Feature
              icon={<Building />}
              label={t`Type`}
              value={property.propertyType}
            />
            <Feature
              icon={<ShieldCheck className="text-green-500" />}
              label={t`Status`}
              value={t`Verified`}
            />
          </div>

          <div className="mb-12">
            <h3 className="display-face mb-4 text-3xl font-bold text-emerald-950 dark:text-emerald-200">{t`Description`}</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities and EMI Calculator... (rest of your code remains the same) */}
          {property.amenities?.length > 0 && (
            <div className="mb-12">
            <h3 className="display-face mb-4 text-3xl font-bold text-emerald-950 dark:text-emerald-200">{t`Amenities`}</h3>
              <div className="flex flex-wrap gap-3">
                {property.amenities.map((a, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-blue-50 dark:bg-slate-800 border dark:border-slate-700 text-sm font-bold rounded-xl dark:text-white"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="luxury-surface rounded-[2rem] p-8">
            <h3 className="text-xl font-black dark:text-white">Private pricing consultation</h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">Contact our advisor for current availability, market guidance, and a private commercial discussion tailored to this property.</p>
          </div>
          <div className="hidden">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
              <Calculator className="text-blue-600" /> {t`EMI Calculator`}
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Slider
                  label={t`Loan Amount`}
                  value={loanAmount}
                  min={100000}
                  max={property.price * 1.2}
                  step={50000}
                  onChange={setLoanAmount}
                  prefix="₹"
                />
                <Slider
                  label={t`Interest Rate`}
                  value={interestRate}
                  min={5}
                  max={18}
                  step={0.1}
                  onChange={setInterestRate}
                  suffix="%"
                />
                <Slider
                  label={t`Tenure (Years)`}
                  value={tenure}
                  min={1}
                  max={30}
                  step={1}
                  onChange={setTenure}
                />
              </div>
              <div className="bg-blue-50 dark:bg-slate-800/50 p-6 rounded-3xl flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-400 uppercase">{t`Monthly EMI`}</p>
                <p className="text-4xl font-black text-blue-600">
                  ₹{Math.round(emiDetails.monthlyEmi).toLocaleString()}
                </p>
                <div className="mt-4 pt-4 border-t dark:border-slate-700 flex justify-between text-sm font-bold">
                  <span className="text-slate-500">{t`Total Interest`}</span>
                  <span className="dark:text-white">
                    ₹{Math.round(emiDetails.totalInterest).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR FORM */}
        <div className="lg:col-span-1">
          <div className="luxury-surface sticky top-24 rounded-[2rem] p-8">
            <p className="mb-1 text-xs font-bold uppercase text-slate-400">Private availability</p>
            <h2 className="display-face mb-8 text-3xl font-bold text-emerald-900 dark:text-emerald-300">Best-in-market guidance</h2>
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <a href="tel:+919791674849" className="flex items-center justify-center gap-2 rounded-xl bg-emerald-950 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800"><Phone size={18}/> Call for details</a>
              <a href={`https://wa.me/919791674849?text=${encodeURIComponent(`Hello Estatera team,\n\nI am interested in *${property.title}*.\n\nPlease share the current availability, private pricing guidance, and suitable viewing times.\n\nMy details:\nName: ${user?.user?.name || "Interested customer"}\nEmail: ${user?.user?.email || "I will share this shortly"}${phone ? `\nPhone: ${phone}` : ""}\n\nThank you.`)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-emerald-900 px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50 dark:border-emerald-300 dark:text-emerald-300 dark:hover:bg-emerald-950/30"><MessageCircle size={18}/> WhatsApp our advisor</a>
            </div>
            <form onSubmit={handleRequestVisit} className="space-y-4">
              {/* Form fields... (your existing code) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{t`Email`}</label>
                <input
                  type="text"
                  value={user?.user?.email || ""}
                  readOnly
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{t`Mobile Number`}</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-4 bg-slate-100 dark:bg-slate-800 dark:text-white rounded-xl outline-none focus:ring-2 ring-blue-500/20"
                />
              </div>
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  className="luxury-button w-full rounded-xl py-4 font-black"
                >{t`Request Visit`}</button>
                <button
                  type="button"
                  onClick={downloadPremiumBrochure}
                  className="w-full flex items-center justify-center gap-2 border-2 border-blue-600/10 text-blue-600 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all"
                >
                  <FileText size={20} /> {t`Download Brochure`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {relatedProperties.length > 0 && <section className="mx-auto mt-20 max-w-[76rem] px-5"><div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="editorial-label text-amber-700">Continue exploring</p><h2 className="display-face mt-2 text-5xl font-bold text-emerald-950 dark:text-emerald-200">More to consider.</h2></div><p className="max-w-sm text-sm leading-6 text-stone-500 dark:text-stone-400">A selection of properties with a similar character, type, or setting.</p></div><div className="grid gap-7 md:grid-cols-3">{relatedProperties.map((listing) => <PropertyCard key={listing._id} property={listing}/>)}</div></section>}
    </motion.div>
  </>;
}

function Feature({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 flex-shrink-0">
      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">
          {label}
        </p>
        <p className="font-black text-slate-800 dark:text-white text-sm">
          {value}
        </p>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  prefix = "",
  suffix = "",
}) {
  return (
    <div>
      <div className="flex justify-between text-sm font-bold mb-2">
        <span className="text-slate-500">{label}</span>
        <span className="text-blue-600">
          {prefix}
          {value.toLocaleString()}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );
}
