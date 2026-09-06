import { Link } from "react-router-dom";
import { Home, List, Phone, User } from "lucide-react";
import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";

export default function Footer() {
  useLingui();

  return (
    <footer className="bg-[#10241d] py-16 text-stone-300">
      <div className="mx-auto grid max-w-304 grid-cols-1 gap-12 px-5 md:grid-cols-3">
        {/* Brand */}
        <div>
          <p className="editorial-label mb-4 text-[#e7c47e]">Estatera</p>
          <h3 className="display-face mb-4 text-4xl font-bold text-white">
            Places made meaningful.
          </h3>
          <p className="text-sm leading-relaxed">
            {t`Discover verified premium lands and architecturally stunning homes designed for your future.`}
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold mb-4">{t`Browse Properties`}</h4>

          <ul className="space-y-3 text-sm">
            <li>
              <Link
                to="/"
                className="flex items-center gap-2 hover:text-white transition"
              >
                <Home size={16} /> {t`Home`}
              </Link>
            </li>
            <li>
              <Link
                to="/listings"
                className="flex items-center gap-2 hover:text-white transition"
              >
                <List size={16} /> {t`Available Listings`}
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="flex items-center gap-2 hover:text-white transition"
              >
                <Phone size={16} /> {t`Call Us`}
              </Link>
            </li>
            <li>
              <Link
                to="/profile"
                className="flex items-center gap-2 hover:text-white transition"
              >
                <User size={16} /> Profile
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-bold mb-4">{t`Contact Our Experts`}</h4>

          <div className="space-y-2 text-sm">
            <p>{t`Office Address`}: Pudupattinam, Kalpakkam</p>
            <p>{t`Email Us`}: estatera.team@gmail.com</p>
            <p>{t`Call Us`}: +91 97916 74849</p>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="mx-auto mt-12 max-w-304 border-t border-white/15 px-5 pt-6 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} Estatera. {t`Luxury Living`} {t`Redefined`}
      </div>
    </footer>
  );
}
