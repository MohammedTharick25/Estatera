import { motion } from "framer-motion";
import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useMemo } from "react"; // Added useMemo for efficiency

export default function Testimonials() {
  // 1. Subscribe to language changes
  useLingui();

  // 2. Define the reviews array INSIDE the component.
  // We use useMemo so the array isn't recreated on every tiny re-render,
  // but it will update if the language changes.
  const reviews = useMemo(
    () => [
      {
        id: 1,
        name: t`John Doe`,
        text: t`Finding the perfect land was so easy with Estatera. Highly recommended!`,
        role: t`Investor`,
      },
      {
        id: 2,
        name: t`Sarah Jenkins`,
        text: t`The team helped me find my dream home in a prime location. Excellent service!`,
        role: t`Homeowner`,
      },
      {
        id: 3,
        name: t`Michael Ross`,
        text: t`Verified properties and professional guidance. My future is secure.`,
        role: t`Repeat Client`,
      },
    ],
    [],
  ); // Empty dependency array is fine because useLingui handles the refresh

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Heading */}
        <h2
          id="testimonials-heading"
          className="text-3xl md:text-4xl font-black text-center mb-12 text-slate-900 dark:text-white"
        >
          {t`10k+ Happy Clients`}
        </h2>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              whileHover={{ y: -8 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:shadow-black/30 transition-all duration-300"
            >
              {/* Review Text */}
              <p className="italic text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                "{review.text}"
              </p>

              {/* Name */}
              <h4 className="font-bold text-slate-900 dark:text-white">
                {review.name}
              </h4>

              {/* Role */}
              <span className="text-sm text-blue-600 font-medium">
                {review.role}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
