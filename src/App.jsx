import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import HomePage from "./pages/HomePage";

const ServicePage = lazy(() => import("./pages/ServicePage"));
const FertigteilePage = lazy(() => import("./pages/FertigteilePage"));
const ArtworksPage = lazy(() => import("./pages/ArtworksPage"));
const MaterialienPage = lazy(() => import("./pages/MaterialienPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const ImpressumPage = lazy(() => import("./pages/ImpressumPage"));
const DatenschutzPage = lazy(() => import("./pages/DatenschutzPage"));
const AGBPage = lazy(() => import("./pages/AGBPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen bg-neutral-950" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/service" element={<ServicePage />} />
          <Route path="/fertigteile" element={<FertigteilePage />} />
          <Route path="/artworks" element={<ArtworksPage />} />
          <Route path="/materialien" element={<MaterialienPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
          <Route path="/datenschutz" element={<DatenschutzPage />} />
          <Route path="/agb" element={<AGBPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
