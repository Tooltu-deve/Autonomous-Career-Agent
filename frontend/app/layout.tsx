import type { Metadata } from 'next';
import './globals.css';
import landing from './images/landing.png';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'CareerNav — Navigate Your Career Autonomously',
  description: 'AI-powered job search, tailored resumes, and ATS insights.',
  openGraph: {
    images: [{ url: landing.src, alt: 'CareerNav landing page' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof Node !== 'undefined' && Node.prototype) {
                const origRemove = Node.prototype.removeChild;
                Node.prototype.removeChild = function(child) {
                  if (child.parentNode !== this) {
                    return child.parentNode ? child.parentNode.removeChild(child) : child;
                  }
                  return origRemove.call(this, child);
                };
                const origInsert = Node.prototype.insertBefore;
                Node.prototype.insertBefore = function(newNode, refNode) {
                  if (refNode && refNode.parentNode !== this) {
                    return refNode.parentNode ? refNode.parentNode.insertBefore(newNode, refNode) : refNode;
                  }
                  return origInsert.call(this, newNode, refNode);
                };
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
