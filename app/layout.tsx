import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { GlobalCustomerModal } from "@/components/shared/GlobalCustomerModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "POS System",
  description: "Modern POS system for managing sales and inventory",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen">
            <Sidebar />
            <div className="flex-1 lg:pl-72">
              <Header />
              <main className="p-6">{children}</main>
            </div>
          </div>
          <GlobalCustomerModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
