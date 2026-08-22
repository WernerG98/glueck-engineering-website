import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import FertigteilePage from "./pages/FertigteilePage";
import ArtworksPage from "./pages/ArtworksPage";
import ServicePage from "./pages/ServicePage";
import MaterialienPage from "./pages/MaterialienPage";
import FAQPage from "./pages/FAQPage";
import ImpressumPage from "./pages/ImpressumPage";
import DatenschutzPage from "./pages/DatenschutzPage";
import AGBPage from "./pages/AGBPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
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
  );
}
