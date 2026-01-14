import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3 in a Row - Multiplayer",
  description: "Play 4 in a row with up to 3 players online",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
