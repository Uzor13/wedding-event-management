import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "Wedding RSVP",
  description: "Wedding RSVP Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning>
        <AuthProvider>
          <SettingsProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </SettingsProvider>
        </AuthProvider>
      <Analytics/>
      </body>
    </html>
  );
}
