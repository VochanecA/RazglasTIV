import './globals.css';
import type { Metadata, Viewport } from 'next';
import Head from 'next/head';
import { Manrope } from 'next/font/google';
import { UserProvider } from '@/lib/auth';
import { getUser } from '@/lib/db/queries';
import Navbar from '@/components/ui/navbar';
import { NotificationCenter } from '@/components/ui/NotificationCenter';



interface CustomTwitterMetadata {
  card: string;
  site?: string;
  creator?: string;
}

interface CustomOpenGraphImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

interface CustomMetadata extends Metadata {
  keywords?: string;
  robots?: string;
  openGraph?: {
    title?: string;
    description?: string;
    url?: string;
    siteName?: string;
    images?: CustomOpenGraphImage[];
  };
  twitter?: CustomTwitterMetadata;
}

export const metadata: CustomMetadata = {
  title: 'AeroVoice by Alen',
  description: 'AeroVoice Airport PA system for Tivat Airport',
  keywords: 'AeroVoice, Airport, PA system, next.js, web app, SEO, progressive web app',
  openGraph: {
    title: 'AeroVoice Airport PA system',
    description: 'AeroVoice Airport PA system for Tivat Airport',
    url: 'https://www.aerovoice.app',
    siteName: 'AeroVoice Airport PA system',
    images: [
      {
        url: 'https://www.yourwebsite.com/images/og-image.jpg',
        width: 800,
        height: 600,
        alt: 'Open Graph image description',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@your_twitter_handle',
    creator: '@creator_handle',
  },
  robots: 'index, follow',
};


export const viewport: Viewport = {
  maximumScale: 1,
};

const manrope = Manrope({ subsets: ['latin'] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userPromise = getUser();

  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
    >
      <Head>
        {/* Primary SEO tags */}
        <title>{metadata.title as string}</title>
        <meta name="description" content={metadata.description as string} />
        <meta name="keywords" content={metadata.keywords as string} />
        <meta name="robots" content={metadata.robots as string} />

        {/* Open Graph / Facebook */}
        <meta property="og:title" content={metadata.openGraph?.title as string} />
        <meta property="og:description" content={metadata.openGraph?.description as string} />
        <meta property="og:url" content={metadata.openGraph?.url as string} />
        <meta property="og:site_name" content={metadata.openGraph?.siteName as string} />
        {metadata.openGraph?.images?.map((image: { url: string }, index: number) => (
  <meta key={index} property="og:image" content={image.url} />
))}


        {/* Twitter Card */}
        <meta name="twitter:card" content={metadata.twitter?.card as string} />
        <meta name="twitter:site" content={metadata.twitter?.site as string} />
        <meta name="twitter:creator" content={metadata.twitter?.creator as string} />

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=UA-XXXXXXX-X"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'UA-XXXXXXX-X');
            `,
          }}
        />

        {/* Additional Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </Head>

      <body className="min-h-[100dvh] bg-gray-50 flex flex-col">
        <UserProvider userPromise={userPromise}>
          <Navbar />
          <main className="flex-1">{children}</main>
        </UserProvider>
        <NotificationCenter />

      </body>
    </html>
  );
}
