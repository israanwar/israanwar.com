import source from '../../israanwar-master-rate-card-v2.md?raw';
import { parseRateCard } from '../lib/rateCard';
export const RATE_CARD = parseRateCard(source);
// Public commercial policies come from the same locked document as prices.
export const PRICING_RULES = source.split('# Global Pricing Rules')[1]?.split('\n---')[0]
  .split('\n').filter((line) => line.startsWith('|'))
  .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
  .filter(([name, policy]) => name !== 'Rule' && !name.startsWith('---') && policy) || [];
