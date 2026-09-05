import { Mail, Phone, MapPin } from "lucide-react";
import emailjs from "@emailjs/browser";
import { useRef } from "react";
import axios from "axios";
import { t } from "@lingui/macro";
import { toast } from "react-hot-toast";

export default function Contact() {
  const form = useRef();

  const sendEmail = async (e) => {
    e.preventDefault();

    const formData = new FormData(form.current);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/inquiries`, {
        name: formData.get("user_name"),
        email: formData.get("user_email"),
        message: `${formData.get("subject")}\n\n${formData.get("message")}`,
      });
    } catch (error) {
      toast.error(t`Failed to send message`);
      console.error(error);
      return;
    }

    emailjs
      .sendForm(
        import.meta.env.VITE_EMAIL_SERVICE_ID,
        import.meta.env.VITE_EMAIL_TEMPLATE_ID,
        form.current,
        import.meta.env.VITE_EMAIL_PUBLIC_KEY,
      )
      .then(
        () => {
          toast.success(t`Message sent successfully!`);
          form.current.reset();
        },
        (error) => {
          toast.error(t`Failed to send message`);
          console.error(error);
        },
      );
  };

  return (
    <div className="min-h-screen transition-colors" style={{ background: "var(--canvas)" }}>
      <div className="mx-auto max-w-[76rem] px-5 py-20">
        {/* Header */}
        <div className="mb-16 max-w-3xl">
          <p className="editorial-label mb-4 text-amber-700">A considered conversation</p>
          <h1 className="display-face text-6xl font-bold text-emerald-950 dark:text-stone-100 md:text-7xl">
            {t`Contact Our Experts`}
          </h1>

          <p className="mt-5 text-lg leading-8 text-stone-600 dark:text-stone-400">
            {t`We are here to help you find your next big investment.`}
          </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-8">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-950 p-4 text-[#e7c47e] shadow-md">
                <Phone />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {t`Call Us`}
                </h4>

                <p className="text-slate-600 dark:text-slate-400">
                  +91 97916 74849
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-950 p-4 text-[#e7c47e] shadow-md">
                <Mail />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {t`Email Us`}
                </h4>

                <p className="text-slate-600 dark:text-slate-400">
                  estatera.team@gmail.com
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-950 p-4 text-[#e7c47e] shadow-md">
                <MapPin />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {t`Office Address`}
                </h4>

                <p className="text-slate-600 dark:text-slate-400">
                  Pudupattinam, Kalpakkam, Tamil Nadu, India
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="luxury-surface rounded-4xl p-8 lg:col-span-2 transition-colors">
            <form
              ref={form}
              onSubmit={sendEmail}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <input
                name="user_name"
                type="text"
                placeholder={t`Full Name`}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 p-4 text-slate-900 outline-none ring-emerald-800/20 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white placeholder:text-slate-400"
                required
              />

              <input
                name="user_email"
                type="email"
                placeholder={t`Email Address`}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 p-4 text-slate-900 outline-none ring-emerald-800/20 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white placeholder:text-slate-400"
                required
              />

              <input
                name="subject"
                type="text"
                placeholder={t`Subject`}
                className="md:col-span-2 w-full rounded-xl border border-stone-200 bg-stone-50 p-4 text-slate-900 outline-none ring-emerald-800/20 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white placeholder:text-slate-400"
                required
              />

              <textarea
                name="message"
                placeholder={t`How can we help you?`}
                className="md:col-span-2 h-40 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-4 text-slate-900 outline-none ring-emerald-800/20 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white placeholder:text-slate-400"
                required
              ></textarea>

              <button
                type="submit"
                className="luxury-button md:col-span-2 rounded-xl py-4 text-lg font-bold"
              >
                {t`Send Message`}
              </button>
            </form>
          </div>
        </div>

        {/* Map */}
        <div className="mt-16 h-96 overflow-hidden rounded-4xl border border-stone-200 shadow-inner grayscale transition-all duration-700 hover:grayscale-0 dark:border-stone-700">
          <iframe
            src="https://www.google.com/maps?q=Chennai,Tamil%20Nadu&output=embed"
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
