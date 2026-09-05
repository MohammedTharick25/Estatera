import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { t } from "@lingui/macro";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Gem,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/signup`,
        formData,
      );
      toast.success(t`Account created successfully! Welcome.`);
      navigate("/login");
    } catch (err) {
      toast.error(
        err.response?.data?.error || t`Registration failed. Please try again.`,
      );
    } finally {
      setLoading(false);
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="flex min-h-screen overflow-hidden font-manrope" style={{ background: "var(--canvas)" }}>
      {/* LEFT SIDE: Cinematic Visual & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <motion.img
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          src="signup.avif"
          className="absolute inset-0 w-full h-full object-cover"
          alt="Luxury Villa Exterior"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-transparent backdrop-blur-[1px]" />

        <div className="relative z-10 flex flex-col justify-between h-full p-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b88a45] text-[#10241d] shadow-lg">
              <Gem size={20} />
            </div>
            <span className="text-white font-black text-2xl tracking-tighter uppercase italic">
              Estatera
            </span>
          </motion.div>

          <div className="space-y-8">
            <motion.h1
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-6xl font-black text-white leading-tight"
            >
              Building <br /> <span className="text-[#e7c47e]">Legacies</span>{" "}
              <br /> Since Today.
            </motion.h1>

            <div className="grid gap-4 max-w-md">
              <FeatureCard
                icon={<ShieldCheck className="text-emerald-400" />}
                title={t`Legal Protection`}
                desc={t`Every listing is verified by our internal legal team.`}
              />
              <FeatureCard
                icon={<Sparkles className="text-amber-400" />}
                title={t`Early Access`}
                desc={t`Get notified about prime locations before they hit the public market.`}
              />
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-slate-400 text-sm font-medium"
          >
            © {new Date().getFullYear()} Estatera Global Realty. All Rights
            Reserved.
          </motion.p>
        </div>
      </div>

      {/* RIGHT SIDE: The Form */}
      <div className="relative flex w-full flex-col justify-center overflow-y-auto bg-[#f0ede4] px-8 dark:bg-slate-950 md:px-20 lg:w-1/2 lg:px-32">
        <Link
          to="/"
          className="absolute top-10 left-8 lg:left-32 text-slate-400 hover:text-blue-600 flex items-center gap-2 font-bold text-sm transition-all group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />{" "}
          {t`Back to exploration`}
        </Link>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-md w-full mx-auto py-20"
        >
          <motion.div variants={itemVariants} className="mb-12">
            <p className="editorial-label mb-3 text-amber-700">Private membership</p><h2 className="display-face mb-3 text-5xl font-bold text-slate-900 dark:text-white">
              {t`Join the Elite.`}
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              {t`Create your membership to access the world's most prestigious property portfolio.`}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">{t`Full Name`}</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Ex: Alexander Pierce"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 ring-blue-500/10 dark:text-white transition-all placeholder:text-slate-300"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">{t`Email Address`}</label>
              <input
                type="email"
                name="email"
                required
                placeholder="alexander@luxury.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 ring-blue-500/10 dark:text-white transition-all placeholder:text-slate-300"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">{t`Security Password`}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 ring-blue-500/10 dark:text-white transition-all placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="luxury-button flex w-full items-center justify-center gap-3 rounded-xl py-5 text-lg font-black disabled:opacity-70"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  {t`Initialize Membership`}
                </>
              )}
            </motion.button>
          </form>

          <motion.p
            variants={itemVariants}
            className="mt-10 text-center text-slate-500 font-bold"
          >
            {t`Already part of the inner circle?`}{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:underline decoration-2 underline-offset-4 font-black"
            >
              {t`Sign In`}
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 flex gap-5 items-start hover:bg-white/15 transition-colors group"
    >
      <div className="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
        <p className="text-slate-300 text-xs leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}
