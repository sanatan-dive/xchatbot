import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import picture from "../../public/image.png"
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Twibble",
  description: "Chat with yours or others X clone",
  openGraph: {
    title: "Twibble",
    description: "Chat with your or others' X clone personas!",
    url: "https://twibble-alpha.vercel.app/", 
    siteName: "Twibble",
    images: [
      {
        url: picture.src, 
        width: 1200,
        height: 630,
        alt: "Twibble - Chat with X clones",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="h-full">
          <div className="fixed inset-0 -z-10">
            <div className="relative h-full w-full bg-stone-950">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
              <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fcfcfc36,#0c0a09)]"></div>
            </div>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
