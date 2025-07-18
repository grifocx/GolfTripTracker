import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Safari compatibility: Check if root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Add error boundary for better Safari error handling
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

createRoot(rootElement).render(<App />);
