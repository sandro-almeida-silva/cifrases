import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Cifrases",
  description: "Sua música, no tempo certo.",
  applicationName: "Cifrases",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/cifrases.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark">
      <body>{children}</body>
    </html>
  );
}
