import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
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

// Platzhalter beim Nachladen einer Seite: erscheint erst nach kurzer Verzögerung,
// damit schnelle Wechsel nicht flackern.
function RouteSkeleton() {
  return (
    <div className="skeleton-delay min-h-screen bg-neutral-950" aria-hidden="true">
      <div className="border-b border-neutral-800/80 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-neutral-900" />
          <div className="h-4 w-36 animate-pulse rounded bg-neutral-900" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="h-3 w-40 animate-pulse rounded bg-neutral-900" />
        <div className="mt-5 h-10 w-full max-w-xl animate-pulse rounded bg-neutral-900" />
        <div className="mt-3 h-10 w-2/3 max-w-md animate-pulse rounded bg-neutral-900" />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="h-48 animate-pulse rounded-2xl bg-neutral-900" />
          <div className="h-48 animate-pulse rounded-2xl bg-neutral-900" />
          <div className="h-48 animate-pulse rounded-2xl bg-neutral-900" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteSkeleton />}>
        <div key={pathname} className="page-enter">
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
        </div>
      </Suspense>
    </>
  );
}
