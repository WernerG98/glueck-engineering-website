import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ArtworksPage from "./pages/ArtworksPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/artworks" element={<ArtworksPage />} />
    </Routes>
  );
}
