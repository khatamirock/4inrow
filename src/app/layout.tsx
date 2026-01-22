import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "4 in a Row - Multiplayer Game",
    description: "Play 4 in a Row online with friends",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
