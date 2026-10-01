import type { Continent } from './types';

export const CONTINENT_ORDER: Continent[] = ['europe', 'asia', 'africa', 'northAmerica', 'southAmerica', 'oceania', 'other'];

export const CONTINENT_LABELS: Record<Continent, string> = {
  europe: 'Europe',
  asia: 'Asie',
  africa: 'Afrique',
  northAmerica: 'Amérique du Nord',
  southAmerica: 'Amérique du Sud',
  oceania: 'Océanie',
  other: 'Autre',
};

const CODES: Record<Continent, string> = {
  europe: 'AD AL AT BA BE BG BY CH CY CZ DE DK EE ES FI FR GB GR HR HU IE IS IT LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SK SM UA VA XN',
  asia: 'AE AF AM AZ BD BH BN BT CN GE HK ID IL IN IQ IR JO JP KG KH KP KR KW KZ LA LB LK MM MN MV MY NP OM PH PK QA SA SG SY TH TJ TL TM TR TW UZ VN YE',
  africa: 'AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EG ER ET GA GH GM GN GQ GW KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RW SC SD SL SN SO SS ST SZ TD TG TN TZ UG ZA ZM ZW',
  northAmerica: 'AG AW BB BS BZ CA CR CU CW DM DO GD GL GP GT HN HT JM KN KY LC MQ MX NI PA PR SV TT US VC',
  southAmerica: 'AR BO BR CL CO EC GF GY PE PY SR UY VE',
  oceania: 'AS AU FJ FM KI MH NC NR NZ PF PG PW SB TO TV VU WS',
  other: 'AQ',
};

/** The continent of each ISO code (Russia counts as Europe; Turkey, Georgia, Armenia, Azerbaijan and Kazakhstan as Asia;
 * Central America and the Caribbean as North America). A code that is in no list is treated as `other`. */
export const CONTINENT_OF: Record<string, Continent> = Object.fromEntries(
  (Object.entries(CODES) as [Continent, string][]).flatMap(([continent, codes]) =>
    codes.split(' ').map((code) => [code, continent] as const),
  ),
);
