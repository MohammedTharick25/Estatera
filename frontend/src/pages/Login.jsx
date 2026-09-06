import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { t } from "@lingui/macro";
import { toast } from "react-hot-toast";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Globe,
  KeyRound,
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const hints = await navigator.userAgentData?.getHighEntropyValues?.(["model", "platform", "platformVersion", "architecture", "bitness", "fullVersionList"]).catch(() => ({}));
      const browser = hints?.fullVersionList?.find((entry) => /Chrome|Edge|Firefox/i.test(entry.brand));
      const platform = hints?.platform || "";
      const version = hints?.platformVersion ? ` ${hints.platformVersion}` : "";
      const architecture = hints?.architecture && hints?.bitness ? ` · ${hints.architecture} ${hints.bitness}-bit` : "";
      const browserLabel = browser ? ` · ${browser.brand} ${browser.version}` : "";
      // Mobile Chrome may provide a real model. Desktop browsers intentionally
      // withhold the PC manufacturer/model for privacy, so retain honest system details.
      const deviceLabel = hints?.model ? `${hints.model} · ${platform}${browserLabel}` : platform ? `${platform}${version}${architecture}${browserLabel}` : "";
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          email,
          password,
          deviceLabel,
        },
      );
      login(res.data);
      toast.success(t`Access granted. Welcome back.`);
      navigate("/");
    } catch (err) {
      toast.error(t`Authentication failed. Check your access keys.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Identical Animation Variants as Signup
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
      {/* LEFT SIDE: Cinematic Visual (Mirrors Signup structure) */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <motion.img
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop"
          className="absolute inset-0 w-full h-full object-cover"
          alt="Luxury Architecture"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-transparent backdrop-blur-[1px]" />

        <div className="relative z-10 flex flex-col justify-between h-full p-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b88a45] text-[#10241d] shadow-lg">
              <Globe size={20} />
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
              Resume <br /> Your <span className="text-[#e7c47e]">Journey</span>{" "}
              <br /> In Luxury.
            </motion.h1>

            <div className="flex gap-10">
              <LoginStat label={t`Global Portfolios`} value="1.2k+" />
              <LoginStat label={t`Secure Assets`} value="100%" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
            <ShieldCheck size={14} className="text-blue-500" />
            {t`Encrypted Session`}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Adjusted exactly like Signup page */}
      <div className="relative flex w-full flex-col justify-center overflow-y-auto bg-[#f0ede4] px-8 dark:bg-slate-950 md:px-20 lg:w-1/2 lg:px-32">
        {/* Identical Back Button Position */}
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
          {/* Header section matches Signup spacing */}
          <motion.div variants={itemVariants} className="mb-12">
            <p className="editorial-label mb-3 text-amber-700">Private access</p><h2 className="display-face mb-3 text-5xl font-bold text-slate-900 dark:text-white">
              {t`Welcome Back.`}
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              {t`Please authenticate your identity to access your private real estate collection.`}
            </p>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* EMAIL INPUT */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">{t`Identity`}</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@estatera.com"
                  className="w-full p-4 pl-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 ring-blue-500/10 dark:text-white transition-all placeholder:text-slate-300"
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                />
              </div>
            </motion.div>

            {/* PASSWORD INPUT */}
            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t`Access Key`}</label>
                <Link to="/forgot-password" className="text-[10px] font-black uppercase text-emerald-800 hover:underline dark:text-emerald-300">Forgot Password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full p-4 pl-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 ring-blue-500/10 dark:text-white transition-all placeholder:text-slate-300"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <KeyRound
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
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
              disabled={isLoading}
              className="luxury-button flex w-full items-center justify-center gap-3 rounded-xl py-5 text-lg font-black disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t`Secure Login`
              )}
            </motion.button>
          </form>

          {/* Footer matches Signup spacing and font weight */}
          <motion.p
            variants={itemVariants}
            className="mt-10 text-center text-slate-500 font-bold"
          >
            {t`New to the network?`}{" "}
            <Link
              to="/signup"
              className="text-blue-600 hover:underline decoration-2 underline-offset-4 font-black"
            >
              {t`Initialize Membership`}
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

function LoginStat({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-white font-black text-3xl tracking-tighter leading-none">
        {value}
      </span>
      <span className="text-blue-300 text-[9px] font-black uppercase tracking-widest mt-1 opacity-60">
        {label}
      </span>
    </div>
  );
}
