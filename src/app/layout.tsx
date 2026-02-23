import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";



export const metadata: Metadata = {
  title: "OmriLinkTree - מנהל הקישורים",
  description: "Powered by Ori Guy Studio x Omri",
  icons: {
    icon: "/logo%20omri.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <link
  rel="icon"
  href="/logo%20omri.png"
  type="image"
/>
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
