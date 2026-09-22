import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

import { night } from '@/themes';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
//
// Fixes a mobile-browser bug where the address bar auto-hiding/showing on
// scroll (Safari iOS / Chrome Android) reveals a white gap at the bottom of
// the page: the root <html>/<body> had no explicit background (defaulting to
// white), and nothing accounted for the dynamic viewport height that changes
// as the browser toolbar collapses/expands.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/*
          Match the root html/body/#root background to the app's theme background so that any
          area the browser reveals behind the app (e.g. while its toolbar is animating on
          scroll) shows the theme color instead of the default white canvas. Also reinforce the
          full-height chain with 100dvh (dynamic viewport height), which reflows as the mobile
          toolbar shows/hides, falling back to 100vh for browsers that don't support dvh yet.
        */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                background-color: ${night.colors.background};
              }
              html, body {
                min-height: 100vh;
                min-height: 100dvh;
              }
              #root {
                min-height: 100vh;
                min-height: 100dvh;
              }
            `,
          }}
        />

        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}
