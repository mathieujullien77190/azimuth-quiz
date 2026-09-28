import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import Section from '@/components/ui/Section';
import Toggle from '@/components/ui/Toggle';
import type { CustomOriginInputsProps, OptionsSectionProps } from './types';

import { createStyles } from './styles';

/**
 * Latitude/longitude fields controlled locally (free text while typing, including a lone "-" or
 * "3."): only pushes a number up once it actually parses and is in range, instead of the field
 * jumping back on every invalid keystroke.
 */
const CustomOriginInputs = ({ latitude, longitude, onChange, disabled = false }: CustomOriginInputsProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const [latText, setLatText] = useState(() => String(latitude));
  const [lonText, setLonText] = useState(() => String(longitude));

  const onLatChange = (text: string) => {
    setLatText(text);
    const value = Number(text.replace(',', '.'));
    if (Number.isFinite(value) && value >= -90 && value <= 90) onChange({ customLatitude: value });
  };
  const onLonChange = (text: string) => {
    setLonText(text);
    const value = Number(text.replace(',', '.'));
    if (Number.isFinite(value) && value >= -180 && value <= 180) onChange({ customLongitude: value });
  };

  return (
    <View style={styles.coordRow}>
      <View style={styles.coordField}>
        <Text style={styles.coordLabel}>{t.setup.customOrigin.latitude}</Text>
        <TextInput
          editable={!disabled}
          keyboardType="numbers-and-punctuation"
          onChangeText={onLatChange}
          placeholderTextColor={colors.textMuted}
          pointerEvents={disabled ? 'none' : 'auto'}
          style={styles.coordInput}
          value={latText}
        />
      </View>
      <View style={styles.coordField}>
        <Text style={styles.coordLabel}>{t.setup.customOrigin.longitude}</Text>
        <TextInput
          editable={!disabled}
          keyboardType="numbers-and-punctuation"
          onChangeText={onLonChange}
          placeholderTextColor={colors.textMuted}
          pointerEvents={disabled ? 'none' : 'auto'}
          style={styles.coordInput}
          value={lonText}
        />
      </View>
    </View>
  );
};

/**
 * "Options" block shared by every game's setup — dumb: a table of on/off options (title,
 * description, value, callback), each one skippable via `hidden`, plus the optional GPS option
 * (`gps`, with its custom-origin fields) for the games that have a starting point.
 */
export const OptionsSection = ({ title, options, gps, disabled = false }: OptionsSectionProps) => (
  <Section title={title}>
    {options
      .filter((option) => !option.hidden)
      .map((option) => (
        <Toggle
          key={option.id}
          description={option.description}
          disabled={disabled}
          label={option.title}
          onValueChange={option.onChange}
          value={option.value}
        />
      ))}
    {gps && (
      <>
        <Toggle
          description={gps.description}
          disabled={disabled}
          label={gps.title}
          onValueChange={gps.onToggleUseGps}
          value={gps.useGps}
        />
        {!gps.useGps && (
          <CustomOriginInputs
            key={gps.ready === false ? 'loading' : 'ready'}
            disabled={disabled}
            latitude={gps.latitude}
            longitude={gps.longitude}
            onChange={gps.onChangeCustomOrigin}
          />
        )}
      </>
    )}
  </Section>
);
