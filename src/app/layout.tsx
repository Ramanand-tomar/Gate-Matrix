import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "GATE 2025/2026 Test Series & Topic Analytics — GATEPrep Studio",
  description: "Master GATE Exam for Computer Science (CS), Data Science & AI (DA), Electrical (EE), Electronics (EC), Mechanical (ME), and Civil (CE). Practice official CBT pattern mocks, topic accuracy analytics, step-by-step KaTeX solutions, and subject bundles.",
  keywords: [
    "GATE 2025 Test Series",
    "GATE 2026 Preparation",
    "GATE Computer Science Mock Test",
    "GATE Data Science AI Practice",
    "GATE Electrical Engineering Test Series",
    "GATE Electronics Communication Mocks",
    "GATE Mechanical Engineering Questions",
    "GATE Civil Engineering Practice Papers",
    "GATE Topic Wise Tests",
    "GATE CBT Online Exam Engine",
  ],
  authors: [{ name: "GATEPrep Studio Team" }],
  metadataBase: new URL("https://gate-matrix.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "GATEPrep Studio — Official GATE Test Series & Topic Analytics",
    description: "Prepare for GATE with real CBT exam engine, topic-level weak area analysis, and past paper test series across all 6 major engineering streams.",
    url: "https://gate-matrix.vercel.app",
    siteName: "GATEPrep Studio",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GATEPrep Studio — Official GATE Test Series",
    description: "Practice 1,061+ official GATE test papers and topic analytics.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('gate_theme');
                  if (stored === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#090d16] text-[#14213d] dark:text-[#f8fafc] transition-colors duration-200">
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <Navbar />
                <div className="flex-1">{children}</div>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
