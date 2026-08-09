import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ArtworksPage from "./pages/ArtworksPage";
import ImpressumPage from "./pages/ImpressumPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/artworks" element={<ArtworksPage />} />
      <Route path="/impressum" element={<ImpressumPage />} />
    </Routes>
  );
}
