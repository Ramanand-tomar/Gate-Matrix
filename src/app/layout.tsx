import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
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
  openGraph: {
    title: "GATEPrep Studio — Official GATE Test Series & Topic Analytics",
    description: "Prepare for GATE with real CBT exam engine, topic-level weak area analysis, and past paper test series across all 6 major engineering streams.",
    url: "https://gateprep.studio",
    siteName: "GATEPrep Studio",
    locale: "en_IN",
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
      <body className="antialiased min-h-screen flex flex-col bg-[#f8fafc] text-[#14213d]">
        <AuthProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
