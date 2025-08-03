import type { Metadata } from "next";
import React from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export const metadata: Metadata = {
  title: "Alérgenos - RecetasAPI",
  description: "Gestiona alérgenos y restricciones alimentarias",
};

interface AllergensLayoutProps {
  children: React.ReactNode;
}

export default function AllergensLayout({ children }: AllergensLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content */}
      <div className="lg:ml-64">
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}