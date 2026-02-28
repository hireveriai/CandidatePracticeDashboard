import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireVeri Candidate",
  description: "Calm Interview Experience",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}