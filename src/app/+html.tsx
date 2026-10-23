import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

import { night } from '@/themes';

// Web seulement, execute sous Node au rendu statique (pas de DOM).
// Corrige la bande blanche en bas quand la barre d'adresse mobile se replie : fond et hauteur explicites.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Pas de defilement du body sur le web : les ScrollView se comportent comme en natif. */}
        <ScrollViewStyleReset />

        {/* Fond du theme sous l'app (plus de blanc) ; 100dvh suit la barre mobile, repli sur 100vh. */}
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

      </head>
      <body>{children}</body>
    </html>
  );
}
