import type { Metadata } from 'next';
import { Poppins, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Cal.com design system: "Cal Sans" for headings (substitute: Poppins),
// Inter for body/UI text.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TeamFlow — Multi-tenant task management for teams',
  description:
    'One workspace for every team. Real-time task boards, role-based access, analytics, and audit logs — with true multi-tenant isolation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
