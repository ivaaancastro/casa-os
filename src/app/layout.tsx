import type { Metadata } from 'next';
import { Bodoni_Moda, Jost } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ui',
});

export const metadata: Metadata = {
  title: 'casa-os | Tu hogar digital',
  description: 'Gestión de dispositivos, notas familiares y más',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${bodoniModa.variable} ${jost.variable}`}>
      <body className="font-ui bg-canvas text-ink antialiased">
        <div className="flex min-h-screen bg-canvas">
          <Sidebar />
          <main className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
