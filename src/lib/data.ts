import type {
  Barangay,
  CategoryId,
  Feeling,
  GroupId,
  Localized,
  Report,
  SurveyResponse,
  TimeOfDay,
} from './types';

export const NAGA_CENTER = { lat: 13.6235, lng: 123.1985 };
export const PILOT_BARANGAY = 'Concepcion Pequeña';

/** All 27 barangays of Naga City. Coordinates are approximate centroids for map centering. */
export const BARANGAYS: Barangay[] = [
  { name: 'Abella', lat: 13.6235, lng: 123.187 },
  { name: 'Bagumbayan Norte', lat: 13.633, lng: 123.195 },
  { name: 'Bagumbayan Sur', lat: 13.628, lng: 123.196 },
  { name: 'Balatas', lat: 13.638, lng: 123.205 },
  { name: 'Calauag', lat: 13.634, lng: 123.188 },
  { name: 'Cararayan', lat: 13.63, lng: 123.245 },
  { name: 'Carolina', lat: 13.665, lng: 123.29 },
  { name: 'Concepcion Grande', lat: 13.623, lng: 123.215 },
  { name: 'Concepcion Pequeña', lat: 13.618, lng: 123.205 },
  { name: 'Dayangdang', lat: 13.627, lng: 123.191 },
  { name: 'Del Rosario', lat: 13.61, lng: 123.215 },
  { name: 'Dinaga', lat: 13.6215, lng: 123.1905 },
  { name: 'Igualdad Interior', lat: 13.6195, lng: 123.188 },
  { name: 'Lerma', lat: 13.625, lng: 123.189 },
  { name: 'Liboton', lat: 13.63, lng: 123.19 },
  { name: 'Mabolo', lat: 13.615, lng: 123.18 },
  { name: 'Pacol', lat: 13.65, lng: 123.225 },
  { name: 'Panicuason', lat: 13.67, lng: 123.31 },
  { name: 'Peñafrancia', lat: 13.629, lng: 123.199 },
  { name: 'Sabang', lat: 13.618, lng: 123.186 },
  { name: 'San Felipe', lat: 13.642, lng: 123.205 },
  { name: 'San Francisco', lat: 13.623, lng: 123.193 },
  { name: 'San Isidro', lat: 13.645, lng: 123.26 },
  { name: 'Santa Cruz', lat: 13.616, lng: 123.195 },
  { name: 'Tabuco', lat: 13.615, lng: 123.19 },
  { name: 'Tinago', lat: 13.622, lng: 123.198 },
  { name: 'Triangulo', lat: 13.617, lng: 123.2 },
];

export interface CategoryDef {
  id: CategoryId;
  color: string;
  icon: string; // Feather icon name
  label: Localized;
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'lighting', color: '#F29A00', icon: 'moon', label: { en: 'Poor lighting', fil: 'Madilim na lugar' } },
  { id: 'harassment', color: '#FF3D71', icon: 'alert-triangle', label: { en: 'Harassment hotspot', fil: 'Lugar ng pambabastos' } },
  { id: 'abandoned', color: '#64748B', icon: 'home', label: { en: 'Abandoned area', fil: 'Abandonadong lugar' } },
  { id: 'route', color: '#00A896', icon: 'navigation', label: { en: 'Unsafe route', fil: 'Delikadong daanan' } },
  { id: 'flooding', color: '#2F7BFF', icon: 'droplet', label: { en: 'Flooding / hazard', fil: 'Baha / panganib' } },
  { id: 'other', color: '#A855F7', icon: 'more-horizontal', label: { en: 'Other', fil: 'Iba pa' } },
];

export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;

export const TIMES: { id: TimeOfDay; label: Localized }[] = [
  { id: 'day', label: { en: 'Daytime', fil: 'Umaga/Hapon' } },
  { id: 'evening', label: { en: 'Evening', fil: 'Takipsilim' } },
  { id: 'night', label: { en: 'Night', fil: 'Gabi' } },
];

export const GROUPS: { id: GroupId; label: Localized }[] = [
  { id: 'everyone', label: { en: 'Everyone', fil: 'Lahat' } },
  { id: 'girls', label: { en: 'Girls / women', fil: 'Babae' } },
  { id: 'lgbtq', label: { en: 'LGBTQ+ youth', fil: 'LGBTQ+ na kabataan' } },
  { id: 'pwd', label: { en: 'Persons with disability', fil: 'May kapansanan (PWD)' } },
  { id: 'osy', label: { en: 'Out-of-school youth', fil: 'Out-of-school youth' } },
];

export const FEELINGS: { id: Feeling; label: Localized; score: number }[] = [
  { id: 'safe', label: { en: 'Safe', fil: 'Ligtas' }, score: 4 },
  { id: 'mostly_safe', label: { en: 'Mostly safe', fil: 'Halos ligtas' }, score: 3 },
  { id: 'sometimes_unsafe', label: { en: 'Sometimes unsafe', fil: 'Minsan delikado' }, score: 2 },
  { id: 'unsafe', label: { en: 'Unsafe', fil: 'Delikado' }, score: 1 },
];

export const WANTS: { id: string; label: Localized }[] = [
  { id: 'lighting', label: { en: 'Lighting', fil: 'Ilaw' } },
  { id: 'patrols', label: { en: 'Patrols', fil: 'Ronda ng tanod' } },
  { id: 'cctv', label: { en: 'CCTV', fil: 'CCTV' } },
  { id: 'sidewalks', label: { en: 'Sidewalks', fil: 'Bangketa' } },
  { id: 'cleanup', label: { en: 'Clean-up of lots', fil: 'Paglilinis ng bakanteng lote' } },
  { id: 'helpdesk', label: { en: 'Help desk / hotline', fil: 'Help desk / hotline' } },
  { id: 'drainage', label: { en: 'Drainage', fil: 'Kanal' } },
];

const day = (d: number, h = 18) => new Date(2026, 9, d, h, 15).toISOString();

type Seed = [CategoryId, string, number, number, number, TimeOfDay, GroupId, string, number];
const SEED: Seed[] = [
  ['lighting', 'Concepcion Pequeña', 13.6185, 123.2062, 3, 'night', 'girls', 'Walang ilaw sa kanto malapit sa covered court.', 20],
  ['lighting', 'Peñafrancia', 13.6295, 123.1985, 2, 'evening', 'everyone', 'Sirang poste ng ilaw malapit sa tulay.', 21],
  ['lighting', 'Balatas', 13.6372, 123.2041, 4, 'night', 'girls', 'Dark alley on the way to school.', 22],
  ['lighting', 'Triangulo', 13.6172, 123.2008, 3, 'night', 'everyone', 'Weak lighting around the terminal area.', 22],
  ['harassment', 'Dinaga', 13.6218, 123.1908, 4, 'night', 'girls', 'Catcalling near the plaza after 9 PM.', 23],
  ['harassment', 'Abella', 13.624, 123.1868, 3, 'evening', 'lgbtq', 'Group harasses passers-by near the waiting shed.', 24],
  ['harassment', 'San Felipe', 13.6415, 123.206, 4, 'night', 'girls', 'Pambabastos sa jeepney stop.', 24],
  ['abandoned', 'Tabuco', 13.6148, 123.1895, 3, 'night', 'everyone', 'Abandoned lot beside the river, no lights.', 25],
  ['abandoned', 'Lerma', 13.6255, 123.1885, 2, 'day', 'osy', 'Empty building used as a hangout at night.', 25],
  ['route', 'Concepcion Grande', 13.6232, 123.214, 3, 'evening', 'everyone', 'No sidewalk along the highway to school.', 26],
  ['route', 'Calauag', 13.6345, 123.1878, 3, 'night', 'pwd', 'Broken pavement, hard for wheelchair users.', 26],
  ['route', 'Del Rosario', 13.6105, 123.2148, 4, 'night', 'girls', 'Long dark stretch walking home from the tricycle terminal.', 27],
  ['flooding', 'Concepcion Pequeña', 13.6176, 123.2045, 1, 'day', 'everyone', 'Baradong kanal.', 29],
  ['flooding', 'Sabang', 13.6182, 123.1858, 3, 'day', 'everyone', 'Road floods knee-deep after heavy rain.', 28],
  ['flooding', 'Mabolo', 13.6152, 123.1805, 2, 'evening', 'everyone', 'Open manhole near the chapel.', 28],
  ['other', 'Igualdad Interior', 13.6198, 123.1882, 2, 'evening', 'everyone', 'Stray dogs chase students at night.', 29],
];

export const SEED_REPORTS: Report[] = [
  ...SEED.map(([category, barangay, lat, lng, severity, timeOfDay, group, description, d], i) => ({
    id: `seed-${i + 1}`,
    category,
    barangay,
    lat,
    lng,
    severity,
    timeOfDay,
    group,
    description,
    status: 'approved' as const,
    createdAt: day(d),
    log: [
      { at: day(d), action: 'submitted' as const },
      { at: day(d, 20), action: 'approved' as const, note: 'Verified during walk-through' },
    ],
  })),
  {
    id: 'seed-p1',
    category: 'lighting',
    barangay: 'Concepcion Pequeña',
    lat: 13.619,
    lng: 123.207,
    severity: 3,
    timeOfDay: 'night',
    group: 'everyone',
    description: 'Streetlight blinking on and off near the barangay hall.',
    status: 'pending',
    createdAt: day(30, 21),
    log: [{ at: day(30, 21), action: 'submitted' }],
  },
  {
    id: 'seed-p2',
    category: 'harassment',
    barangay: 'Santa Cruz',
    lat: 13.616,
    lng: 123.1952,
    severity: 3,
    timeOfDay: 'evening',
    group: 'girls',
    description: 'Being followed near the bakery on the way home.',
    status: 'pending',
    createdAt: day(31, 19),
    log: [{ at: day(31, 19), action: 'submitted' }],
  },
];

type SSeed = [string, Feeling, TimeOfDay, GroupId, string, string[]];
const SSEED: SSeed[] = [
  ['Concepcion Pequeña', 'mostly_safe', 'night', 'everyone', 'Sa may Canda street kapag 10 PM pataas.', ['lighting', 'patrols', 'cctv']],
  ['Balatas', 'sometimes_unsafe', 'night', 'girls', 'Sa likod ng covered court pag gabi, walang ilaw at walang tao.', ['lighting', 'patrols']],
  ['Dinaga', 'unsafe', 'night', 'girls', 'Plaza area is scary after classes end late.', ['patrols', 'helpdesk']],
  ['Calauag', 'sometimes_unsafe', 'day', 'pwd', 'Sidewalks are broken and blocked by vendors.', ['sidewalks']],
  ['Abella', 'sometimes_unsafe', 'evening', 'lgbtq', 'People shout insults near the waiting shed.', ['patrols', 'helpdesk']],
  ['Sabang', 'mostly_safe', 'day', 'everyone', 'Flooding makes the road dangerous.', ['drainage']],
  ['Tabuco', 'sometimes_unsafe', 'night', 'osy', 'Empty lot near the river feels dangerous.', ['cleanup', 'lighting']],
];

export const SEED_SURVEYS: SurveyResponse[] = SSEED.map(([barangay, feeling, timeOfDay, group, comment, wants], i) => ({
  id: `survey-${i + 1}`,
  barangay,
  feeling,
  timeOfDay,
  group,
  comment,
  wants,
  createdAt: day(29, 10 + i),
}));

export interface Contact {
  name: string;
  detail: Localized;
  number: string;
  verified: boolean; // national hotlines known; local ones must be confirmed by the team
}

export const CONTACTS: Contact[] = [
  { name: 'Emergency Hotline', detail: { en: 'Police, fire, medical emergencies', fil: 'Pulis, sunog, medikal na emergency' }, number: '911', verified: true },
  { name: 'NCMH Crisis Hotline', detail: { en: 'Mental health crisis support, 24/7', fil: 'Suporta sa mental health, 24/7' }, number: '1553', verified: true },
  { name: 'Bantay Bata 163', detail: { en: 'Child abuse and child protection concerns', fil: 'Pang-aabuso sa bata' }, number: '163', verified: true },
  { name: '1343 Actionline', detail: { en: 'Trafficking and violence against women & children', fil: 'Trafficking at karahasan sa kababaihan at bata' }, number: '1343', verified: true },
  { name: 'Naga City Bawal Bastos hotline', detail: { en: 'Gender-based street harassment (Ord. 2023-107)', fil: 'Pambabastos sa kalye (Ord. 2023-107)' }, number: 'To be confirmed', verified: false },
  { name: 'PNP Women & Children Protection Desk', detail: { en: 'Harassment or abuse involving women and minors', fil: 'Pambabastos o pang-aabuso sa kababaihan at menor de edad' }, number: 'To be confirmed', verified: false },
  { name: 'CSWDO Naga City', detail: { en: 'Safeguarding, referrals, and social support', fil: 'Proteksyon, referral, at suportang panlipunan' }, number: 'To be confirmed', verified: false },
  { name: 'Barangay VAW Desk / BCPC', detail: { en: 'Your barangay hall — VAW desk and child protection council', fil: 'Barangay hall — VAW desk at BCPC' }, number: 'Visit barangay hall', verified: false },
];
