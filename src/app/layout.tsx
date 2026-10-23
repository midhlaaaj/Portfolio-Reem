import type { Metadata, Viewport } from 'next';
import { Archivo, Figtree } from 'next/font/google';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--f-archivo',
  display: 'swap',
});
const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--f-figtree',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
};

export const viewport: Viewport = { themeColor: '#050505', colorScheme: 'dark' };

/** Marks the document as motion-capable before first paint so reveal start states never flash. */
/* If the motion engine has not started within 3.5s (very slow device, script blocked), reveal everything. */
const PRE_PAINT = `try{var d=document.documentElement;if(location.pathname==='/'&&!scrollY)d.classList.add('hero-top');if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('rv-on');if(location.pathname==='/'&&!sessionStorage.getItem('rf-intro-seen')){d.classList.add('intro-first');window.__t0=performance.now()}setTimeout(function(){if(!window.__rv)d.classList.remove('rv-on','intro-first')},3500)}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${figtree.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
