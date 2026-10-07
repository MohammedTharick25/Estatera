import { motion, useReducedMotion } from "framer-motion";
import { Building2 } from "lucide-react";
import { t } from "@lingui/macro";
import useLocaleRerender from "../hooks/useLocaleRerender";

export default function LoadingSpinner({
  fullScreen = false,
  message = t`Finding a place you'll love…`,
}) {
  const prefersReducedMotion = useReducedMotion();
  useLocaleRerender();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={`relative isolate flex w-full flex-col items-center justify-center overflow-hidden ${
        fullScreen
          ? "min-h-[70vh] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#f4ead5] via-[#f7f5ef] to-[#eeece5] dark:from-[#1c3329] dark:via-[#101916] dark:to-[#101916]"
          : "min-h-72 rounded-3xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#f4ead5] via-[#f7f5ef] to-[#eeece5] dark:from-[#1c3329] dark:via-[#101916] dark:to-[#101916]"
      }`}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d5b779]/20 blur-3xl dark:bg-emerald-800/20" />
      <div className="relative z-10 flex h-40 w-40 items-center justify-center">
        <motion.div
          animate={prefersReducedMotion ? undefined : { rotate: 360 }}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-[#b88a45]/35"
        >
          <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#b88a45] shadow-[0_0_18px_#b88a45]" />
        </motion.div>
        <motion.div
          animate={prefersReducedMotion ? undefined : { rotate: -360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="absolute inset-3 rounded-full border border-dashed border-emerald-900/25 dark:border-emerald-200/20"
        >
          <span className="absolute bottom-3 right-0 h-2 w-2 rounded-full bg-emerald-800 shadow-[0_0_14px_#17634b] dark:bg-emerald-300" />
        </motion.div>
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  scale: [1, 1.06, 1],
                  boxShadow: [
                    "0 0 0 0 rgba(184,138,69,.08)",
                    "0 0 34px 8px rgba(184,138,69,.2)",
                    "0 0 0 0 rgba(184,138,69,.08)",
                  ],
                }
          }
          transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
          className="flex h-24 w-24 items-center justify-center rounded-full border border-white/80 bg-[#fffdf8]/90 text-emerald-950 shadow-[0_18px_55px_rgba(23,32,29,.16)] backdrop-blur dark:border-white/10 dark:bg-[#16231e]/90 dark:text-emerald-100"
        >
          <Building2 size={36} strokeWidth={1.4} aria-hidden="true" />
        </motion.div>
      </div>

      <p className="editorial-label mt-7 text-[#8e6a32] dark:text-[#d7ae68]">
        Estatera
      </p>
      <p className="mt-2 px-6 text-center text-sm font-semibold tracking-wide text-[#53615b] dark:text-[#c4cec7]">
        {message}
      </p>
      <div
        className="mt-5 h-1 w-36 overflow-hidden rounded-full bg-[#d9d5ca] dark:bg-[#30443a]"
        aria-hidden="true"
      >
        <motion.div
          animate={
            prefersReducedMotion ? { scaleX: 0.45 } : { x: ["-100%", "210%"] }
          }
          transition={{
            repeat: prefersReducedMotion ? 0 : Infinity,
            duration: prefersReducedMotion ? 0 : 1.8,
            ease: "easeInOut",
          }}
          className="h-full w-1/2 origin-left rounded-full bg-gradient-to-r from-[#b88a45] via-[#e7c47e] to-[#173d32] dark:to-[#a9c6af]"
        />
      </div>
    </div>
  );
}
