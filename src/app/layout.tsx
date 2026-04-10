import type { Metadata } from "next";
import { Old_Standard_TT } from "next/font/google";
import "./globals.css";

const oldStandard = Old_Standard_TT({
  variable: "--font-old-standard",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Abigail's Peter Rabbit Game",
  description: "Help Peter Rabbit navigate the garden and collect carrots!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${oldStandard.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-(family-name:--font-old-standard)">
        {children}
      </body>
    </html>
  );
}
