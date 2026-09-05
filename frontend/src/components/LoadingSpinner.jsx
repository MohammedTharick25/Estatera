import { motion } from "framer-motion";

export default function LoadingSpinner({
  fullScreen = false,
  message = "Processing media and details...",
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${
        fullScreen ? "min-h-screen w-full" : "min-h-64"
      } flex flex-col items-center justify-center`}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-stone-200 border-t-emerald-900 rounded-full"
      />

      <p className="mt-4 text-slate-500 font-medium animate-pulse text-center">
        {message}
      </p>
    </div>
  );
}
