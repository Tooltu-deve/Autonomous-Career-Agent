import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <Sidebar />
      <div style={{ minWidth: 0, overflowX: "hidden" }}>{children}</div>
    </div>
  );
}
