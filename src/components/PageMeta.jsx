import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://glueck-engineering.com";
const SITE_NAME = "Glück Engineering";
const DEFAULT_DESCRIPTION =
  "Individuelle Fertigteile, technische 3D-Drucklösungen und mehrschichtige 3D-Artworks aus einer Hand.";

function setMetaByName(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function setMetaByProperty(property, content) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("property", property);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function setCanonical(href) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

export default function PageMeta({ title, description }) {
  const { pathname } = useLocation();

  useEffect(() => {
    const pageTitle = title ? `${title} – ${SITE_NAME}` : SITE_NAME;
    const ogTitle = title ? `${title} – ${SITE_NAME}` : `${SITE_NAME} – Fertigteile, 3D-Druck & 3D-Artworks`;
    const pageDescription = description || DEFAULT_DESCRIPTION;
    const canonicalUrl = pathname === "/" ? SITE_URL : `${SITE_URL}${pathname}`;

    document.title = pageTitle;

    setMetaByName("description", pageDescription);
    setMetaByProperty("og:title", ogTitle);
    setMetaByProperty("og:description", pageDescription);
    setMetaByProperty("og:url", canonicalUrl);
    setMetaByName("twitter:title", ogTitle);
    setMetaByName("twitter:description", pageDescription);
    setCanonical(canonicalUrl);
  }, [title, description, pathname]);

  return null;
}
