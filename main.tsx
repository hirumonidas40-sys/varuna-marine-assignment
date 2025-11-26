import React from "react";
import { createRoot } from "react-dom/client";
import App from "./adapters/ui/App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<App />);
