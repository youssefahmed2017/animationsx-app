import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import NavAuth from "@/components/NavAuth";
import { ToastProvider } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AnimationsX",
  description: "Publish, browse, and remix CSS-only animations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <ToastProvider>
          <header className="border-b border-neutral-800">
            <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
              <Link href="/" className="font-semibold tracking-tight text-lg">
                AnimationsX
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/browse" className="hover:text-white text-neutral-300">
                  Browse
                </Link>
                <Link href="/publish" className="hover:text-white text-neutral-300">
                  Publish
                </Link>
                <NavAuth />
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
