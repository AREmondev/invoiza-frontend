import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ConvexClientProvider } from "@/app/providers/convex-provider";
import { AuthProvider } from "@/app/providers/auth-provider";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import { GlobalCustomerModal } from "@/components/shared/GlobalCustomerModal";
import { DataInitializationProvider } from "@/components/providers/data-initialization-provider";

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
          <AuthProvider>
            <ConvexClientProvider>
              <DataInitializationProvider>
                <ConditionalLayout>
                  {children}
                </ConditionalLayout>
                <GlobalCustomerModal />
              </DataInitializationProvider>
            </ConvexClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
