import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RecetasAPI - Gestión de Recetas",
  description: "Sistema de gestión de recetas, ingredientes y eventos gastronómicos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased bg-white text-gray-900`}>
        <AuthProvider>
          <ToastProvider position="top-right">
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
