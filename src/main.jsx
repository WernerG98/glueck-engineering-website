import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import CursorSpotlight from "./components/CursorSpotlight";
import ScrollProgress from "./components/ScrollProgress";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollProgress />
      <CursorSpotlight />
      <App />
      <Analytics />
    </BrowserRouter>
  </React.StrictMode>
);
