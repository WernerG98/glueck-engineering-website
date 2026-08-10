import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ArtworksPage from "./pages/ArtworksPage";
import ImpressumPage from "./pages/ImpressumPage";
import DatenschutzPage from "./pages/DatenschutzPage";
import AGBPage from "./pages/AGBPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/artworks" element={<ArtworksPage />} />
      <Route path="/impressum" element={<ImpressumPage />} />
      <Route path="/datenschutz" element={<DatenschutzPage />} />
      <Route path="/agb" element={<AGBPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
