import type { Metadata } from 'next';
import 'lenis/dist/lenis.css';
import './globals.scss';

export const metadata: Metadata = {
  title: 'fuel meal plans & cold-pressed drinks',
  description:
    'Animation challenge: a single scroll-driven landing page for a fitness nutrition brand.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
