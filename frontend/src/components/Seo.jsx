import { useEffect } from "react";

const siteUrl = (import.meta.env.VITE_SITE_URL || "https://estatera.onrender.com").replace(/\/$/, "");
const defaultImage = `${siteUrl}/og-whatsapp.png`;

const setMeta = (selector, attribute, value) => {
  let element = document.head.querySelector(selector);
  if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, selector.match(/=["']([^"']+)/)?.[1] || ""); document.head.appendChild(element); }
  element.content = value;
};

export default function Seo({ title, description, path = "/", image = defaultImage, type = "website", noIndex = false, schema }) {
  useEffect(() => {
    const fullTitle = title.includes("Estatera") ? title : `${title} | Estatera`;
    const canonical = `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
    document.title = fullTitle;
    setMeta('meta[name="description"]', "name", description);
    setMeta('meta[name="robots"]', "name", noIndex ? "noindex,nofollow" : "index,follow,max-image-preview:large");
    setMeta('meta[property="og:title"]', "property", fullTitle); setMeta('meta[property="og:description"]', "property", description); setMeta('meta[property="og:url"]', "property", canonical); setMeta('meta[property="og:image"]', "property", image); setMeta('meta[property="og:type"]', "property", type);
    setMeta('meta[name="twitter:title"]', "name", fullTitle); setMeta('meta[name="twitter:description"]', "name", description); setMeta('meta[name="twitter:image"]', "name", image);
    let link = document.head.querySelector('link[rel="canonical"]'); if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); } link.href = canonical;
    const previous = document.getElementById("page-schema"); if (previous) previous.remove();
    if (schema) { const script = document.createElement("script"); script.id = "page-schema"; script.type = "application/ld+json"; script.text = JSON.stringify(schema); document.head.appendChild(script); }
  }, [title, description, path, image, type, noIndex, schema]);
  return null;
}

export { siteUrl };
