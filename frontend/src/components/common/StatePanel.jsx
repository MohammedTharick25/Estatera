import { AlertCircle, ArrowRight, SearchX } from "lucide-react";
import { Link } from "react-router-dom";

export default function StatePanel({ type = "empty", title, message, actionTo, actionLabel }) {
  const Icon = type === "error" ? AlertCircle : SearchX;
  return <section role={type === "error" ? "alert" : "status"} className="luxury-surface mx-auto max-w-xl rounded-[2rem] p-10 text-center"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0ede4] text-emerald-900 dark:bg-slate-800 dark:text-emerald-300"><Icon size={25}/></div><p className="editorial-label text-amber-700">Estatera</p><h2 className="display-face mt-3 text-4xl font-bold">{title}</h2><p className="mx-auto mt-4 max-w-sm leading-7 text-stone-600 dark:text-stone-400">{message}</p>{actionTo && <Link to={actionTo} className="luxury-button mx-auto mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold">{actionLabel}<ArrowRight size={16}/></Link>}</section>;
}
