import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register("/GForce/sw.js", { updateViaCache: "none" })
      .then((r) => {
        const notify = () =>
          window.dispatchEvent(new CustomEvent("gforce-update", { detail: r }));
        if (r.waiting) notify();
        r.addEventListener("updatefound", () =>
          r.installing?.addEventListener("statechange", () => {
            if (r.waiting && navigator.serviceWorker.controller) notify();
          }),
        );
      })
      .catch(() => {
        /* O app continua funcionando sem instalação. */
      });
  });
}
