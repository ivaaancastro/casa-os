import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Jost } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';

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
  applicationName: 'casa·os',
  appleWebApp: {
    capable: true,
    title: 'casa·os',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      {
        url: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  colorScheme: 'light',
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
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
