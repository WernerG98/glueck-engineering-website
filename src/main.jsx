import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import { MerkzettelProvider } from "./context/MerkzettelContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <MerkzettelProvider>
        <App />
        <Analytics />
      </MerkzettelProvider>
    </BrowserRouter>
  </React.StrictMode>
);
