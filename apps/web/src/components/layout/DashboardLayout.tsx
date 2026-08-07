import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}