import { addEn } from '../../i18n';

export type Vibe = 'praia' | 'cultura' | 'natureza' | 'festa' | 'luxo' | 'aventura' | 'gastronomia';

export interface Destination {
  id: string;
  name: string;
  en: string;
  flag: string;
  country: string;
  /** Custo e distância: 1 (perto e barato) a 5 (caro e longe). */
  tier: 1 | 2 | 3 | 4 | 5;
  vibes: Vibe[];
  /** País do jogo ao qual o destino pertence (viagem doméstica sai mais barata). */
  gc?: string;
}

type Row = [id: string, name: string, en: string, flag: string, country: string, tier: 1 | 2 | 3 | 4 | 5, vibes: Vibe[], gc?: string];

const rows: Row[] = [
  ['rio', 'Rio de Janeiro', 'Rio de Janeiro', '🇧🇷', 'Brasil', 1, ['praia', 'festa'], 'br'],
  ['noronha', 'Fernando de Noronha', 'Fernando de Noronha', '🇧🇷', 'Brasil', 2, ['praia', 'natureza'], 'br'],
  ['gramado', 'Gramado', 'Gramado', '🇧🇷', 'Brasil', 1, ['gastronomia', 'natureza'], 'br'],
  ['buenos-aires', 'Buenos Aires', 'Buenos Aires', '🇦🇷', 'Argentina', 2, ['cultura', 'gastronomia'], 'ar'],
  ['patagonia', 'Patagônia', 'Patagonia', '🇦🇷', 'Argentina', 3, ['natureza', 'aventura'], 'ar'],
  ['machu-picchu', 'Machu Picchu', 'Machu Picchu', '🇵🇪', 'Peru', 3, ['aventura', 'cultura']],
  ['cancun', 'Cancún', 'Cancún', '🇲🇽', 'México', 2, ['praia', 'festa'], 'mx'],
  ['cidade-do-mexico', 'Cidade do México', 'Mexico City', '🇲🇽', 'México', 2, ['cultura', 'gastronomia'], 'mx'],
  ['nova-york', 'Nova York', 'New York', '🇺🇸', 'Estados Unidos', 3, ['cultura', 'festa', 'gastronomia'], 'us'],
  ['miami', 'Miami', 'Miami', '🇺🇸', 'Estados Unidos', 3, ['praia', 'festa'], 'us'],
  ['las-vegas', 'Las Vegas', 'Las Vegas', '🇺🇸', 'Estados Unidos', 3, ['festa', 'luxo'], 'us'],
  ['orlando', 'Orlando', 'Orlando', '🇺🇸', 'Estados Unidos', 3, ['aventura', 'festa'], 'us'],
  ['vancouver', 'Vancouver', 'Vancouver', '🇨🇦', 'Canadá', 3, ['natureza', 'cultura'], 'ca'],
  ['lisboa', 'Lisboa', 'Lisbon', '🇵🇹', 'Portugal', 2, ['cultura', 'gastronomia'], 'pt'],
  ['barcelona', 'Barcelona', 'Barcelona', '🇪🇸', 'Espanha', 3, ['praia', 'festa', 'cultura'], 'es'],
  ['paris', 'Paris', 'Paris', '🇫🇷', 'França', 3, ['cultura', 'luxo', 'gastronomia'], 'fr'],
  ['londres', 'Londres', 'London', '🇬🇧', 'Reino Unido', 3, ['cultura', 'festa'], 'uk'],
  ['roma', 'Roma', 'Rome', '🇮🇹', 'Itália', 3, ['cultura', 'gastronomia'], 'it'],
  ['berlim', 'Berlim', 'Berlin', '🇩🇪', 'Alemanha', 3, ['festa', 'cultura'], 'de'],
  ['amsterda', 'Amsterdã', 'Amsterdam', '🇳🇱', 'Países Baixos', 3, ['festa', 'cultura']],
  ['praga', 'Praga', 'Prague', '🇨🇿', 'Tchéquia', 2, ['cultura', 'festa']],
  ['santorini', 'Santorini', 'Santorini', '🇬🇷', 'Grécia', 4, ['praia', 'luxo']],
  ['islandia', 'Islândia', 'Iceland', '🇮🇸', 'Islândia', 4, ['natureza', 'aventura']],
  ['alpes', 'Alpes Suíços', 'Swiss Alps', '🇨🇭', 'Suíça', 5, ['natureza', 'luxo']],
  ['istambul', 'Istambul', 'Istanbul', '🇹🇷', 'Turquia', 2, ['cultura', 'gastronomia']],
  ['toquio', 'Tóquio', 'Tokyo', '🇯🇵', 'Japão', 4, ['cultura', 'gastronomia'], 'jp'],
  ['quioto', 'Quioto', 'Kyoto', '🇯🇵', 'Japão', 4, ['cultura', 'natureza'], 'jp'],
  ['seul', 'Seul', 'Seoul', '🇰🇷', 'Coreia do Sul', 4, ['cultura', 'festa', 'gastronomia'], 'kr'],
  ['xangai', 'Xangai', 'Shanghai', '🇨🇳', 'China', 3, ['cultura', 'luxo'], 'cn'],
  ['bangkok', 'Bangkok', 'Bangkok', '🇹🇭', 'Tailândia', 2, ['festa', 'gastronomia']],
  ['bali', 'Bali', 'Bali', '🇮🇩', 'Indonésia', 3, ['praia', 'natureza']],
  ['singapura', 'Singapura', 'Singapore', '🇸🇬', 'Singapura', 4, ['luxo', 'gastronomia']],
  ['taj-mahal', 'Agra e o Taj Mahal', 'Agra and the Taj Mahal', '🇮🇳', 'Índia', 2, ['cultura', 'aventura'], 'in'],
  ['dubai', 'Dubai', 'Dubai', '🇦🇪', 'Emirados Árabes', 4, ['luxo', 'festa'], 'ae'],
  ['maldivas', 'Maldivas', 'Maldives', '🇲🇻', 'Maldivas', 5, ['praia', 'luxo']],
  ['cairo', 'Cairo e as Pirâmides', 'Cairo and the Pyramids', '🇪🇬', 'Egito', 2, ['cultura', 'aventura']],
  ['marrakech', 'Marrakech', 'Marrakech', '🇲🇦', 'Marrocos', 2, ['cultura', 'gastronomia']],
  ['cidade-do-cabo', 'Cidade do Cabo', 'Cape Town', '🇿🇦', 'África do Sul', 3, ['natureza', 'aventura'], 'za'],
  ['safari', 'Safári no Quênia', 'Safari in Kenya', '🇰🇪', 'Quênia', 4, ['natureza', 'aventura']],
  ['lagos', 'Lagos', 'Lagos', '🇳🇬', 'Nigéria', 2, ['festa', 'cultura'], 'ng'],
  ['sydney', 'Sydney', 'Sydney', '🇦🇺', 'Austrália', 4, ['praia', 'cultura'], 'au'],
  ['nova-zelandia', 'Nova Zelândia', 'New Zealand', '🇳🇿', 'Nova Zelândia', 5, ['natureza', 'aventura']],
  ['antartida', 'Antártida', 'Antarctica', '🇦🇶', 'Antártida', 5, ['aventura', 'natureza']],
];

export const DESTINATIONS: Destination[] = rows.map(([id, name, en, flag, country, tier, vibes, gc]) => ({ id, name, en, flag, country, tier, vibes, gc }));
export const destById = (id: string) => DESTINATIONS.find((d) => d.id === id)!;

export type TripClass = 'economica' | 'executiva' | 'primeira';
export const CLASSES: Record<TripClass, { label: string; icon: string; mult: number; mood: number; calm: number }> = {
  economica: { label: 'Econômica', icon: '💺', mult: 1, mood: 8, calm: 12 },
  executiva: { label: 'Executiva', icon: '🛋️', mult: 2.4, mood: 10, calm: 16 },
  primeira: { label: 'Primeira classe', icon: '🥂', mult: 5, mood: 12, calm: 20 },
};

/** Custo em dólares (uma semana, por pessoa) por faixa de distância e preço. */
export const TIER_USD: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 700, 2: 1300, 3: 2100, 4: 3300, 5: 5200 };

export const VIBE_LABEL: Record<Vibe, { name: string; icon: string }> = {
  praia: { name: 'Praia', icon: '🏖️' }, cultura: { name: 'Cultura', icon: '🏛️' }, natureza: { name: 'Natureza', icon: '🌿' },
  festa: { name: 'Festa', icon: '🎉' }, luxo: { name: 'Luxo', icon: '🥂' }, aventura: { name: 'Aventura', icon: '🧗' }, gastronomia: { name: 'Gastronomia', icon: '🍽️' },
};

addEn({
  ...Object.fromEntries(DESTINATIONS.flatMap((d) => [[d.name, d.en]])),
  Brasil: 'Brazil', Argentina: 'Argentina', Peru: 'Peru', México: 'Mexico', 'Estados Unidos': 'United States', Canadá: 'Canada',
  Portugal: 'Portugal', Espanha: 'Spain', França: 'France', 'Reino Unido': 'United Kingdom', Itália: 'Italy', Alemanha: 'Germany',
  'Países Baixos': 'Netherlands', Tchéquia: 'Czechia', Grécia: 'Greece', Islândia: 'Iceland', Suíça: 'Switzerland', Turquia: 'Turkey',
  Japão: 'Japan', 'Coreia do Sul': 'South Korea', China: 'China', Tailândia: 'Thailand', Indonésia: 'Indonesia', Singapura: 'Singapore',
  Índia: 'India', 'Emirados Árabes': 'United Arab Emirates', Maldivas: 'Maldives', Egito: 'Egypt', Marrocos: 'Morocco',
  'África do Sul': 'South Africa', Quênia: 'Kenya', Nigéria: 'Nigeria', Austrália: 'Australia', 'Nova Zelândia': 'New Zealand', Antártida: 'Antarctica',
  Econômica: 'Economy', Executiva: 'Business', 'Primeira classe': 'First class',
  ...Object.fromEntries(Object.values(VIBE_LABEL).map((v) => [v.name, ({ Praia: 'Beach', Cultura: 'Culture', Natureza: 'Nature', Festa: 'Party', Luxo: 'Luxury', Aventura: 'Adventure', Gastronomia: 'Food' } as Record<string, string>)[v.name]])),
});
