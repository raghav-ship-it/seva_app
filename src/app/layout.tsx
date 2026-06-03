import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ClientLayout from "@/components/ClientLayout";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seva Premium",
  description: "Intelligent Personal Command Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
        />
      </head>
      <body className="h-screen overflow-hidden flex bg-[var(--bg-primary)] text-[var(--text-main)]">
        <ClientLayout>
          <div className="flex h-full w-full overflow-hidden relative">
            <div className="sidebar-container">
              <Sidebar />
            </div>
            <main className="flex-1 overflow-y-auto relative h-full pb-[70px] md:pb-0">
              {children}
            </main>
            <BottomNav />
          </div>
        </ClientLayout>
      </body>
    </html>
  );
}
