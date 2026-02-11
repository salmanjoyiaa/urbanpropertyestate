import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
});

export const metadata: Metadata = {
    title: {
        default: "UrbanEstate — Premium Rental Properties",
        template: "%s | UrbanEstate",
    },
    description:
        "Discover premium rental apartments, houses, and flats. Connect directly with verified agents and book via WhatsApp.",
    keywords: [
        "rental",
        "property",
        "real estate",
        "apartments",
        "houses",
        "luxury rentals",
    ],
    icons: {
        icon: "/favicon.png",
        apple: "/favicon.png",
    },
    openGraph: {
        title: "UrbanEstate — Premium Rental Properties",
        description:
            "Discover premium rental apartments, houses, and flats from verified agents.",
        type: "website",
        siteName: "UrbanEstate",
    },
    twitter: {
        card: "summary_large_image",
        title: "UrbanEstate — Premium Rental Properties",
        description:
            "Discover premium rental apartments, houses, and flats from verified agents.",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>
                {children}
            </body>
        </html>
    );
}
