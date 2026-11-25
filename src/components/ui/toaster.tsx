"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      closeButton
      gap={10}
      toastOptions={{
        style: {
          background: "#14161b",
          border: "1px solid #2a2d35",
          color: "#f4f5f7",
          borderRadius: "14px",
          fontSize: "13px",
          padding: "12px 14px",
          boxShadow: "0 20px 60px -20px rgba(0,0,0,0.8)",
        },
        classNames: {
          closeButton: "!bg-[#1d2027] !border-[#2f333c] !text-white",
        },
      }}
    />
  );
}
