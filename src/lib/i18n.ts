import { useStore } from './store';
import type { Localized } from './types';

const STRINGS = {
  tagline: { en: 'Youth safety map of Naga City', fil: 'Mapa ng kaligtasan ng kabataan sa Naga' },
  all: { en: 'All', fil: 'Lahat' },
  allCity: { en: 'All of Naga City', fil: 'Buong Lungsod ng Naga' },
  reportConcern: { en: 'Report a concern', fil: 'Mag-ulat ng alalahanin' },
  approvedAnon: { en: 'reviewed reports, all anonymous', fil: 'nasuring ulat, lahat anonymous' },
  askBayanihan: { en: 'Ask BayaniHan', fil: 'Magtanong sa BayaniHan' },
  tabMap: { en: 'Map', fil: 'Mapa' },
  tabReport: { en: 'Report', fil: 'Mag-ulat' },
  tabSurvey: { en: 'Survey', fil: 'Survey' },
  tabFindings: { en: 'Findings', fil: 'Natuklasan' },
  tabMore: { en: 'More', fil: 'Iba pa' },
  barangayMode: { en: 'Barangay mode', fil: 'Barangay mode' },
  chooseBarangay: { en: 'Choose your barangay', fil: 'Piliin ang iyong barangay' },
  pilot: { en: 'Pilot', fil: 'Pilot' },
  category: { en: 'What kind of concern?', fil: 'Anong uri ng alalahanin?' },
  severity: { en: 'How serious is it?', fil: 'Gaano ito kalala?' },
  timeOfDay: { en: 'When does it feel unsafe?', fil: 'Kailan ito delikado?' },
  whoAffected: { en: 'Who is most affected?', fil: 'Sino ang pinaka-apektado?' },
  describe: { en: 'Describe the place (no names or personal details)', fil: 'Ilarawan ang lugar (walang pangalan o personal na detalye)' },
  location: { en: 'Location', fil: 'Lokasyon' },
  tapMap: { en: 'Tap the map to move the pin', fil: 'I-tap ang mapa para ilipat ang pin' },
  useMyLocation: { en: 'Use my location', fil: 'Gamitin ang aking lokasyon' },
  consent: {
    en: 'I understand this report is anonymous, will be reviewed before it appears on the public map, and does not replace calling 911 in an emergency.',
    fil: 'Naiintindihan kong anonymous ang ulat na ito, susuriin muna bago lumabas sa mapa, at hindi ito kapalit ng pagtawag sa 911 kapag emergency.',
  },
  submit: { en: 'Submit', fil: 'Ipadala' },
  thanks: { en: 'Salamat! Your report was sent for review.', fil: 'Salamat! Naipadala na ang iyong ulat para suriin.' },
  surveyTitle: { en: 'Youth safety survey', fil: 'Survey sa kaligtasan ng kabataan' },
  surveyIntro: {
    en: 'Anonymous. About 2 minutes. Your answers help your barangay plan safer spaces.',
    fil: 'Anonymous. Mga 2 minuto. Makakatulong ang sagot mo sa pagpaplano ng barangay.',
  },
  feeling: { en: 'How safe do you feel in public spaces in your barangay?', fil: 'Gaano ka kaligtas sa mga pampublikong lugar sa barangay mo?' },
  identify: { en: 'I identify as / belong to (optional)', fil: 'Ako ay kabilang sa (opsyonal)' },
  wants: { en: 'What would make it safer?', fil: 'Ano ang makakapagpaligtas dito?' },
  whereUnsafe: { en: 'Where or when do you feel unsafe?', fil: 'Saan o kailan ka hindi ligtas?' },
  emergency: { en: 'In danger right now? Call 911.', fil: 'Nasa panganib ngayon? Tumawag sa 911.' },
  tapToCall: { en: 'Tap to call', fil: 'I-tap para tumawag' },
  sendReport: { en: 'Send report', fil: 'Ipadala ang ulat' },
  sendAnswers: { en: 'Send answers', fil: 'Ipadala ang sagot' },
  sentTitle: { en: 'Salamat! Report sent.', fil: 'Salamat! Naipadala ang ulat.' },
  sentBody: {
    en: 'A youth coordinator will review it. Once approved, it appears on the public map without any personal details.',
    fil: 'Susuriin ito ng youth coordinator. Kapag naaprubahan, lalabas ito sa mapa nang walang personal na detalye.',
  },
  surveySentTitle: { en: 'Salamat! Answers recorded.', fil: 'Salamat! Naitala ang iyong sagot.' },
  surveySentBody: {
    en: 'Your answers were saved anonymously and will help your barangay plan safer spaces.',
    fil: 'Anonymous na naitala ang sagot mo at makakatulong sa pagpaplano ng barangay.',
  },
  reportAnother: { en: 'Report another place', fil: 'Mag-ulat ng ibang lugar' },
  viewMap: { en: 'Back to the map', fil: 'Bumalik sa mapa' },
  stillNeeded: { en: 'Still needed:', fil: 'Kulang pa:' },
  reviewedReports: { en: 'reviewed reports', fil: 'nasuring ulat' },
  onlyApproved: { en: 'Only reviewed reports are shown. No names, ever.', fil: 'Nasuring ulat lang ang ipinapakita. Walang pangalan.' },
  locationHint: { en: 'Drag or tap the map to place the pin where the problem is.', fil: 'I-drag o i-tap ang mapa para ilagay ang pin.' },
} satisfies Record<string, Localized>;

export type StringKey = keyof typeof STRINGS;

export function useT() {
  const { lang } = useStore();
  const t = (k: StringKey) => STRINGS[k][lang];
  const L = (l: Localized) => l[lang];
  return { t, L, lang };
}
