import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const titleFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-title",
  weight: ["500", "700"],
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Esporte da Sorte - Assistente de Analise Esportiva",
  description:
    "Assistente de leitura esportiva com contexto, previsoes e explicabilidade",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        className={`${titleFont.variable} ${bodyFont.variable} bg-slate-950 text-white`}
      >
        <div className="flex min-h-screen flex-col overflow-hidden md:h-screen md:flex-row">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
