/** Fixed penalty for buzzing in and being wrong: unlike an unfound round
 * (0 points, see `giveUp`), being wrong genuinely costs something — otherwise buzzing at
 * random would always be risk-free. */
export const WRONG_ANSWER_PENALTY = 10;
