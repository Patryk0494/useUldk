import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import ExampleApp from "./ExampleApp.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ExampleApp />
  </StrictMode>
);
