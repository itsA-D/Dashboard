import "./globals.css";

import type { Metadata } from "next";
import { QueryProvider } from "@/lib/providers/query-provider";
import { AuthProvider } from "@/lib/providers/auth-provider";

export const metadata: Metadata = {
  title: "Zoop Dashboard",
  description: "Role-based spend management dashboard"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
