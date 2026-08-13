import type { Metadata } from 'next';

import './globals.scss';

export const metadata: Metadata = {
  // TODO: your own title/description
  title: 'Fuel — meal plans & cold-pressed drinks',
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
