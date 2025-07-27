import type { Metadata } from "next";
import { Inter, Noto_Sans_Hebrew } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansHebrew = Noto_Sans_Hebrew({ 
  subsets: ["hebrew"],
  variable: "--font-hebrew",
});

export const metadata: Metadata = {
  title: "צ'אט בוט עברי - Hebrew AI Chatbot",
  description: "צ'אט בוט חכם בעברית עם יכולות AI מתקדמות",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSansHebrew.variable} font-hebrew antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  fontFamily: 'Noto Sans Hebrew, Inter, system-ui, sans-serif',
                  direction: 'rtl',
                  textAlign: 'right',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}