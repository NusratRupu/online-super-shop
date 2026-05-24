import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import SupportWidget from "./SupportWidget.jsx";
import FloatingCartWidget from "./FloatingCartWidget.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <><App /><FloatingCartWidget /><SupportWidget /></>
  </React.StrictMode>
);
