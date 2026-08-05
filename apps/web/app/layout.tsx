import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/lib/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SMIT AI Teaching Agent",
    template: "%s · SMIT AI Teaching Agent",
  },
  description:
    "An intelligent learning assistant for Saylani Mass IT Training students. Upload course material and chat with an AI that answers only from your documents.",
  metadataBase: new URL("https://smit-ai.example.com"),
  openGraph: {
    title: "SMIT AI Teaching Agent",
    description:
      "Chat with your course material. Answers grounded in your uploaded documents — never hallucinated.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=window.localStorage.getItem("smit.theme");var d=s? s==="dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;var c=d?"dark":"light";document.documentElement.classList.add(c);document.documentElement.style.colorScheme=c;}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${mono.variable} font-sans`}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
