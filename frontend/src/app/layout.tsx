import type { Metadata } from 'next';
import { DM_Sans, Lexend_Peta } from 'next/font/google';
import '@/styles/globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
});

const lexendPeta = Lexend_Peta({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-dyslexia',
});

export const metadata: Metadata = {
  title: 'IntelliCampus - AI Academic Intelligence Platform',
  description: 'Governed AI-powered academic intelligence platform for universities',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${lexendPeta.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
