import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ToastProvider } from "@/components/Toast";
import { ConfirmHost } from "@/components/ConfirmDialog";
import { HostedBar } from "@/components/HostedBar";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <HostedBar />
      <App />
      <ConfirmHost />
    </ToastProvider>
  </React.StrictMode>
);
