// Regenerates src/components/leafletSource.ts from node_modules/leaflet (run: node scripts/build-leaflet.js).
const fs = require('fs');
const js = fs.readFileSync('node_modules/leaflet/dist/leaflet.js', 'utf8');
const css = fs.readFileSync('node_modules/leaflet/dist/leaflet.css', 'utf8');
const out =
  '/* eslint-disable */\n// GENERATED from leaflet@1.9.4 (BSD-2-Clause, (c) Volodymyr Agafonkin, CloudMade) by scripts/build-leaflet.js.\n' +
  '// Bundled so the map works without downloading Leaflet from a CDN on every launch.\n' +
  `export const LEAFLET_JS = ${JSON.stringify(js)};\nexport const LEAFLET_CSS = ${JSON.stringify(css)};\n`;
fs.writeFileSync('src/components/leafletSource.ts', out);
console.log('wrote src/components/leafletSource.ts', out.length, 'bytes');
