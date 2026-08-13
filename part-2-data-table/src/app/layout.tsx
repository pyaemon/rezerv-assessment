import type { Metadata } from "next";

import { AppShell } from "@/components/dashboard/AppShell";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Rezerv — Studio admin",
  description:
    "Frontend engineering assessment, Part 2: a reusable, fully typed data table rendering a fitness studio class timetable.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
