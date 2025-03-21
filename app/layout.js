import React from 'react';
import dynamic from 'next/dynamic';
import { GlobalProvider } from './GlobalProvider';
dynamic(() => import('./globals.css'));
const Header = dynamic(() => import('@/components/layouts/Header'));
const Head = dynamic(() => import('@/app/head'));

// eslint-disable-next-line react/prop-types
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head />
      <body>
        <GlobalProvider>
          <Header />
          {children}
        </GlobalProvider>
      </body>
    </html>
  );
}
