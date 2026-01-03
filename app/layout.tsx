import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dev-keep.vercel.app"), // Replace with your actual domain
  title: {
    default: "DevKeep - The Ultimate Developer Command Center",
    template: "%s | DevKeep"
  },
  description: "DevKeep is an all-in-one secure workspace for developers. Manage projects, tasks, team attendance, real-time chat, and encrypted credential vaults in one stunning interface.",
  keywords: ["developer workspace", "project management", "credential vault", "team collaboration", "attendance tracking", "developer tools", "secure notes", "code snippets"],
  authors: [{ name: "DevKeep Team" }],
  creator: "DevKeep",
  publisher: "DevKeep",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dev-keep.vercel.app",
    siteName: "DevKeep",
    title: "DevKeep - Secure Developer Workspace",
    description: "Manage your projects, team attendance, and secrets in one secure, high-performance workspace.",
    images: [
      {
        url: "/og-image.png", // Ensure this image exists in public folder
        width: 1200,
        height: 630,
        alt: "DevKeep Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevKeep - Secure Developer Workspace",
    description: "The complete command center for modern development teams.",
    images: ["/og-image.png"],
    creator: "@devkeep",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="google-site-verification" content="DqPlokEkiC-4XG5rSJvkJK24HzkGQpQbSKj2d9uJR-o" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
