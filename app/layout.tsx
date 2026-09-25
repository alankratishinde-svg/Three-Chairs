import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "three chairs",
  description: "Before anyone falls for a flat",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
