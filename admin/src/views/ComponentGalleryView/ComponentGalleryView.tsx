import { SafeAreaProvider } from 'react-native-safe-area-context';

import Compass from '@/components/Compass';
import ContourBoard from '@/components/ContourBoard';
import DistanceSlider from '@/components/DistanceSlider';
import EarthSection from '@/components/EarthSection';
import GameCard from '@/components/GameCard';
import HelicopterButton from '@/components/HelicopterButton';
import InclinationSlider from '@/components/InclinationSlider';
import IndicesClueCard from '@/components/IndicesClueCard';
import Legend from '@/components/Legend';
import MascotButton from '@/components/MascotButton';
import PlaceCard from '@/components/PlaceCard';
import PlayerTabs from '@/components/PlayerTabs';
import RoundResult from '@/components/RoundResult';
import SliderTrack from '@/components/SliderTrack';
import ThemeBackdrop from '@/components/ThemeBackdrop';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import RoundProgress from '@/components/ui/RoundProgress';
import Screen from '@/components/ui/Screen';
import Section from '@/components/ui/Section';
import Stat from '@/components/ui/Stat';
import Toggle from '@/components/ui/Toggle';
import UfoButton from '@/components/UfoButton';
import { flagEmoji, countryName } from '@/constants/places/countries';
import { DISTANCE_MARKS_KM } from '@/constants';
import { formatDistance, kmToRatio } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/themes';

import { GalleryItem } from '../../components/GalleryItem';

import {
  SAMPLE_CONTOUR_CENTER_POSITION,
  SAMPLE_CONTOUR_COUNTRY,
  SAMPLE_CONTOUR_GUESS_POSITION,
  SAMPLE_CONTOUR_NEIGHBORS,
  SAMPLE_CONTOUR_OUTLINE,
  SAMPLE_CONTOUR_BOARD_SIZE,
  SAMPLE_CONTOUR_TRUE_POSITION,
  SAMPLE_DISTANCE_KM,
  SAMPLE_INDICES_BEARING,
  SAMPLE_INDICES_DISTANCE_KM,
  SAMPLE_INDICES_PLACE,
  SAMPLE_MAX_STRAIGHT_KM,
  SAMPLE_MAX_SURFACE_KM,
  SAMPLE_PLACE_GUESSING,
  SAMPLE_PLACE_REVEALED,
  SAMPLE_PLAYERS,
  SAMPLE_ROUND_RECORD,
  SAMPLE_TOTALS,
} from './fixtures';

const noop = () => {};

/**
 * Every "dumb" (purely presentational — its whole render comes from its own props, plus at most
 * `useTheme`/`useTranslation`/`useThemedStyles`) component under the main app's `src/components/`,
 * rendered for real via react-native-web (see `admin/vite.config.ts`) so the app's own component
 * decomposition can be eyeballed in one page. Screens/setup screens/providers/HomeScreen are
 * deliberately excluded — they own real state or orchestrate a whole flow, not "dumb". Grouped by
 * which game screen(s) actually import each one (see each section's own comment for the import
 * graph a component landed in) rather than a guess from the name.
 */
export const ComponentGalleryView = () => {
  const { colors } = useTheme();
  const t = useTranslation();

  const legendItems = [
    ...SAMPLE_PLAYERS.map((player) => ({ label: player.name, color: player.color })),
    { label: t.game.reality, color: colors.truth, ring: true },
  ];

  return (
    // Expo Router wraps every screen in a SafeAreaProvider for free (see expo-router's own root
    // layout) — the real game never has to think about it. Admin doesn't go through Expo Router
    // at all, so `ui/Screen`'s `SafeAreaView` (see Screen.tsx) needs one supplied by hand here,
    // or it throws ("No safe area value available") the moment it tries to read insets.
    // `initialMetrics` makes insets available synchronously on the very first render (zero, which
    // is correct here — a desktop admin tab has no device notch to inset around) instead of
    // waiting on the web implementation's own effect (a scratch element + `getComputedStyle`
    // round trip) to resolve them one tick later.
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 1024, height: 768 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}>
      <section className="gallery-group">
        <h2 className="gallery-group-title">Common</h2>
        <p className="gallery-group-hint">
          Utilisés par au moins deux des trois jeux, ou purement structurels/thématiques (tout `ui/*`, le fond de
          thème, les mascottes...).
        </p>
        <div className="gallery-stack">
          <GalleryItem label="ui/Button">
            <div className="gallery-item-row">
              <Button label="Valider" onPress={noop} />
              <Button label="Suivant" onPress={noop} variant="ghost" />
              <Button disabled label="Désactivé" onPress={noop} />
            </div>
          </GalleryItem>

          <GalleryItem label="ui/Card">
            <Card>
              <p style={{ margin: 0 }}>Contenu de carte quelconque.</p>
            </Card>
          </GalleryItem>

          <GalleryItem label="ui/Chip">
            <div className="gallery-item-row">
              <Chip emoji="🟢" label="Facile" onPress={noop} selected />
              <Chip emoji="🟠" label="Moyen" onPress={noop} selected={false} />
            </div>
          </GalleryItem>

          <GalleryItem label="ui/RoundProgress">
            <div style={{ width: 360 }}>
              <RoundProgress difficulties={['intermediate']} roundNumber={3} totalRounds={10} />
              <RoundProgress difficulties={['easy', 'hard']} roundNumber={7} totalRounds={20} />
            </div>
          </GalleryItem>

          {/* Screen reserves its own full height via flex:1 (SafeAreaView -> ScrollView): needs a
              real flex-column ancestor with a fixed height to not collapse to 0 in a plain block
              box, hence GalleryItem's `height` escape hatch (see its own doc comment). */}
          <GalleryItem height={420} label="ui/Screen">
            <Screen footer={<Button label="Valider" onPress={noop} />} header={<Card>En-tête fixe</Card>}>
              <Card>
                <p style={{ margin: 0 }}>Contenu défilant.</p>
              </Card>
            </Screen>
          </GalleryItem>

          <GalleryItem label="ui/Section">
            <Section hint="Un indice optionnel." title="Un titre de section">
              <p style={{ margin: 0 }}>Enfant quelconque.</p>
            </Section>
          </GalleryItem>

          <GalleryItem label="ui/Stat">
            <div className="gallery-item-row">
              <Stat label="Score" value="1 250" />
              <Stat color={colors.success} label="Cap" value="042°" />
            </div>
            <p className="gallery-item-note">
              Actuellement inutilisé par aucun écran (aucun import ailleurs dans src/components) — inclus quand
              même, c'est une primitive `ui/*` candidate comme les autres.
            </p>
          </GalleryItem>

          <GalleryItem label="ui/Toggle">
            <div style={{ width: 320 }}>
              <Toggle description="Une description optionnelle." label="Une option" onValueChange={noop} value />
            </div>
          </GalleryItem>

          <GalleryItem height={160} label="ThemeBackdrop">
            <div className="gallery-backdrop-frame">
              <ThemeBackdrop />
            </div>
          </GalleryItem>

          <GalleryItem label="PlayerTabs">
            <div style={{ width: 420 }}>
              <PlayerTabs
                activeIndex={1}
                activeLabel={(name) => t.game.playerTurn(name)}
                allowRevision
                answered={[true, false, false]}
                onSelect={noop}
                order={[0, 1, 2]}
                players={SAMPLE_PLAYERS}
              />
            </div>
          </GalleryItem>

          <GalleryItem label="Legend">
            <Legend items={legendItems} />
          </GalleryItem>

          <GalleryItem label="GameCard">
            <div style={{ width: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <GameCard
                ctaLabel={t.home.games.compass.cta}
                icon="🧭"
                meta={t.home.games.compass.meta}
                onPress={noop}
                tagline={t.home.games.compass.tagline}
                title={t.home.games.compass.title}
              />
              <GameCard
                ctaLabel={t.home.games.clues.cta}
                icon="🧩"
                meta={t.home.games.clues.meta}
                onPress={noop}
                tagline={t.home.games.clues.tagline}
                title={t.home.games.clues.title}
              />
              <GameCard
                ctaLabel={t.home.games.contour.cta}
                icon="🗺️"
                meta={t.home.games.contour.meta}
                onPress={noop}
                tagline={t.home.games.contour.tagline}
                title={t.home.games.contour.title}
              />
            </div>
          </GalleryItem>

          <GalleryItem label="MascotButton">
            <MascotButton accessibilityLabel="Réglages" onPress={noop} />
            <p className="gallery-item-note">Thème courant (Night) : soucoupe volante. HelicopterButton/UfoButton ci-dessous montrent les deux dessins directement.</p>
          </GalleryItem>

          <GalleryItem label="HelicopterButton">
            <HelicopterButton accessibilityLabel="Réglages" onPress={noop} />
          </GalleryItem>

          <GalleryItem label="UfoButton">
            <UfoButton accessibilityLabel="Réglages" onPress={noop} />
          </GalleryItem>

          <GalleryItem label="Compass">
            <div className="gallery-item-row">
              <Compass bearing={42} color={SAMPLE_PLAYERS[0].color} size={140} />
              <Compass
                bearing={110}
                color={SAMPLE_PLAYERS[0].color}
                extraNeedles={[{ bearing: 200, color: SAMPLE_PLAYERS[1].color }]}
                size={140}
                truthBearing={80}
              />
            </div>
          </GalleryItem>

          <GalleryItem label="EarthSection">
            <div className="gallery-item-row">
              <EarthSection
                marks={[{ bearing: 60, distanceKm: 3000, color: SAMPLE_PLAYERS[0].color, isTruth: true }]}
                showStraightLine={false}
                size={160}
              />
              <EarthSection
                marks={[{ bearing: 30, distanceKm: 9000, color: SAMPLE_PLAYERS[1].color, isTruth: true }]}
                showStraightLine
                size={160}
                zoomControls
              />
            </div>
          </GalleryItem>
        </div>
      </section>

      <section className="gallery-group">
        <h2 className="gallery-group-title">Boussole (jeu 1)</h2>
        <p className="gallery-group-hint">Importés uniquement par l'arbre de GameScreen.</p>
        <div className="gallery-stack">
          <GalleryItem label="DistanceSlider">
            <div style={{ width: 340 }}>
              <DistanceSlider maxKm={SAMPLE_MAX_SURFACE_KM} onChange={noop} valueKm={SAMPLE_DISTANCE_KM} />
            </div>
          </GalleryItem>

          <GalleryItem label="InclinationSlider">
            <div style={{ width: 340 }}>
              <InclinationSlider distanceKm={6000} maxKm={SAMPLE_MAX_STRAIGHT_KM} onChange={noop} />
            </div>
          </GalleryItem>

          <GalleryItem label="SliderTrack">
            <div style={{ width: 340 }}>
              <SliderTrack
                label={t.sliders.distance}
                marks={DISTANCE_MARKS_KM.filter((km) => km < SAMPLE_MAX_SURFACE_KM).map((km) => ({
                  ratio: kmToRatio(km, SAMPLE_MAX_SURFACE_KM),
                  label: formatDistance(km),
                }))}
                onRatioChange={noop}
                ratio={kmToRatio(SAMPLE_DISTANCE_KM, SAMPLE_MAX_SURFACE_KM)}
                valueText={formatDistance(SAMPLE_DISTANCE_KM)}
              />
            </div>
          </GalleryItem>

          <GalleryItem label="PlaceCard" row>
            <PlaceCard place={SAMPLE_PLACE_GUESSING} showCountry={false} />
            <PlaceCard description={SAMPLE_PLACE_REVEALED.description} place={SAMPLE_PLACE_REVEALED} showCountry />
          </GalleryItem>

          <GalleryItem label="RoundResult">
            <div style={{ width: 420 }}>
              <RoundResult
                options={{ straightLine: false }}
                players={SAMPLE_PLAYERS}
                record={SAMPLE_ROUND_RECORD}
                totals={SAMPLE_TOTALS}
              />
            </div>
          </GalleryItem>
        </div>
      </section>

      <section className="gallery-group">
        <h2 className="gallery-group-title">Indices (jeu 2)</h2>
        <p className="gallery-group-hint">Importé uniquement par l'arbre d'IndicesGameScreen.</p>
        <div className="gallery-stack">
          <GalleryItem label="IndicesClueCard" row>
            <IndicesClueCard clueId="population" label="Population" onPress={noop} place={SAMPLE_INDICES_PLACE} state="locked" />
            <IndicesClueCard
              clueId="population"
              label="Population"
              place={SAMPLE_INDICES_PLACE}
              populationStage={2}
              state="revealed"
            />
            <IndicesClueCard
              bearingDeg={SAMPLE_INDICES_BEARING}
              clueId="bearing"
              label="Cap"
              place={SAMPLE_INDICES_PLACE}
              state="revealed"
            />
            <IndicesClueCard
              bearingDeg={SAMPLE_INDICES_BEARING}
              clueId="distance"
              distanceKm={SAMPLE_INDICES_DISTANCE_KM}
              distanceStage={2}
              label="Distance"
              place={SAMPLE_INDICES_PLACE}
              state="revealed"
            />
            <IndicesClueCard clueId="flagColors" flagStage={3} label="Drapeau" place={SAMPLE_INDICES_PLACE} state="revealed" />
            <IndicesClueCard clueId="letter" label="Lettres" letterStage={2} place={SAMPLE_INDICES_PLACE} state="revealed" />
          </GalleryItem>
        </div>
      </section>

      <section className="gallery-group">
        <h2 className="gallery-group-title">Silhouette (jeu 3, code "Contour")</h2>
        <p className="gallery-group-hint">Importé uniquement par l'arbre de ContourGameScreen.</p>
        <div className="gallery-stack">
          <GalleryItem label="ContourBoard">
            <ContourBoard
              connectors={[{ from: SAMPLE_CONTOUR_GUESS_POSITION, to: SAMPLE_CONTOUR_TRUE_POSITION }]}
              height={SAMPLE_CONTOUR_BOARD_SIZE.height}
              hintLabels={[
                ...SAMPLE_CONTOUR_NEIGHBORS.map(({ neighbor, position }) => ({
                  position,
                  text: flagEmoji(neighbor.code),
                  icon: true,
                })),
                ...SAMPLE_CONTOUR_NEIGHBORS.map(({ neighbor, position }) => ({
                  position,
                  text: countryName(neighbor.code, 'fr'),
                })),
                { position: SAMPLE_CONTOUR_CENTER_POSITION, text: flagEmoji(SAMPLE_CONTOUR_COUNTRY.code), icon: true },
              ]}
              markers={[
                { color: colors.truth, isTruth: true, label: 'Paris', position: SAMPLE_CONTOUR_TRUE_POSITION },
                { color: SAMPLE_PLAYERS[0].color, position: SAMPLE_CONTOUR_GUESS_POSITION },
              ]}
              outline={SAMPLE_CONTOUR_OUTLINE}
              width={SAMPLE_CONTOUR_BOARD_SIZE.width}
            />
          </GalleryItem>
        </div>
      </section>
    </SafeAreaProvider>
  );
};
