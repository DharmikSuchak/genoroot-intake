import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { ClientRoot } from './client-root';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });
const outfit = Outfit({ variable: '--font-outfit', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GenoRoot Intake',
  description: 'Hair & scalp intake questionnaire',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
