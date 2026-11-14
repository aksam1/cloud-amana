import tl from '../../src/story/timeline.json' with { type: 'json' };
import { buildWorld, parseDate, fillDates } from '../../src/lib/mapWorld.js';
for (const n of tl.nodes) console.log(n.id.padEnd(12), JSON.stringify(n.date).padEnd(34), '->', parseDate(n.date));
console.log('---');
const w = buildWorld(tl);
console.log('W', w.W, 'H', w.H);
for (const n of w.nodes) console.log(String(n.i).padStart(2), n.id.padEnd(12), Math.round(n.bp).toString().padStart(14), Math.round(n.x), Math.round(n.y));
console.log('segs', w.segs.length);
console.log('regions', w.regions.map(r=>r.id+':'+Math.round(r.y0)+'-'+Math.round(r.y1)).join(' '));
