import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupDNSPrefetch, setupPreconnect } from "./lib/network.ts";

// Optimize network requests
setupDNSPrefetch();
setupPreconnect();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<App />);
