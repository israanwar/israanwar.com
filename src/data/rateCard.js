import source from '../../israanwar-master-rate-card-v2.md?raw';
import { parseRateCard } from '../lib/rateCard';
export const RATE_CARD = parseRateCard(source);
