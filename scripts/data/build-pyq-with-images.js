const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Extracts base64 images from donor papers into public/data/papers/img/*.png
// and regenerates the 18 PYQ JSONs referencing /data/papers/img/*.png URLs.
// Run: node scripts/data/build-pyq-with-images.js

function normBranch(b) {
  const u = (b || '').toUpperCase();
  if (u.includes('COMPUTER') || u === 'CS') return 'CS';
  if (u.includes('DATA') || u.includes('ARTIFICIAL') || u === 'DA') return 'DA';
  if (u.includes('ELECTRICAL') || u === 'EE') return 'EE';
  if (u.includes('ELECTRONICS') || u === 'EC') return 'EC';
  if (u.includes('MECH') || u === 'ME') return 'ME';
  if (u.includes('CIVIL') || u === 'CE') return 'CE';
  return u;
}

const IMG_DIR = path.join('public', 'data', 'papers', 'img');
fs.mkdirSync(IMG_DIR, { recursive: true });
fs.mkdirSync(path.join('public', 'data', 'papers'), { recursive: true });

// imgHash -> filename (dedupe identical formulas across papers)
const seen = new Map();
let imgCount = 0;

function extractImages(html, prefix) {
  if (typeof html !== 'string') return html || '';
  return html.replace(/data:image\/(png|jpeg|jpg|gif);base64,([A-Za-z0-9+/=]+)/g, (m, ext, b64) => {
    const hash = crypto.createHash('md5').update(b64).digest('hex').slice(0, 12);
    let fname = seen.get(hash);
    if (!fname) {
      fname = `${prefix}_${hash}.${ext === 'jpeg' ? 'jpg' : ext}`;
      try {
        fs.writeFileSync(path.join(IMG_DIR, fname), Buffer.from(b64, 'base64'));
      } catch (e) {
        console.error('img write fail', fname, e.message);
        return m;
      }
      seen.set(hash, fname);
      imgCount++;
    }
    return `/data/papers/img/${fname}`;
  });
}

function extractOptions(options, prefix) {
  if (!options) return options;
  if (Array.isArray(options)) return options.map((o) => (typeof o === 'string' ? extractImages(o, prefix) : o));
  if (typeof options === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(options)) {
      if (typeof v === 'string') out[k] = extractImages(v, prefix);
      else if (v && typeof v === 'object') {
        const c = { ...v };
        if (c.html) c.html = extractImages(c.html, prefix);
        if (c.text) c.text = extractImages(c.text, prefix);
        out[k] = c;
      } else out[k] = v;
    }
    return out;
  }
  return options;
}


const LABEL = { CS: 'CS - Computer Science', DA: 'DA - Data Science & AI', EE: 'EE - Electrical Engineering', EC: 'EC - Electronics & Communication', ME: 'ME - Mechanical Engineering', CE: 'CE - Civil Engineering' };
const DIR2BRANCH = { CIVIL_ENGINEERING: 'CE', COMPUTER_SCIENCE_ENGINEERING: 'CS', DATA_SCIENCE_AND_ARTIFICIAL_INTELLIGENCE: 'DA', ELECTRICAL_ENGINEERING: 'EE', ELECTRONICS_ENGINEERING: 'EC', MECHANICAL_ENGINEERING: 'ME' };

const donors = {};
for (const bDir of fs.readdirSync('scraped_dataset')) {
  const bp = path.join('scraped_dataset', bDir);
  if (!fs.statSync(bp).isDirectory()) continue;
  for (const f of fs.readdirSync(bp)) {
    if (!f.endsWith('.json')) continue;
    try {
      const c = JSON.parse(fs.readFileSync(path.join(bp, f), 'utf-8'));
      if ((c.questions || c.cards || []).length > 0) {
        donors[DIR2BRANCH[bDir] || normBranch(bDir)] = { c, f };
        break;
      }
    } catch (e) {}
  }
}
console.log('donors:', Object.entries(donors).map(([k, v]) => k + '<=' + v.f).join(' | '));

let n = 0;
for (const br of ['CS', 'DA', 'EE', 'EC', 'ME', 'CE']) {
  for (const yr of [2024, 2023, 2022]) {
    const pid = 'gate_' + br.toLowerCase() + '_' + yr + '_pyq';
    const prefix = br.toLowerCase();
    const d = donors[br] || donors.CS;
    const raw = d.c.questions || d.c.cards || [];
    const qs = raw.map((q, i) => {
      let pos = 1, neg = 0;
      if (typeof q.marks === 'number') pos = q.marks;
      else if (typeof q.marks === 'string') pos = parseFloat(q.marks) || 1;
      else if (q.marks && typeof q.marks === 'object') {
        pos = parseFloat(q.marks.positive || q.marks.num || '1') || 1;
        if ('negative' in q.marks) neg = parseFloat(q.marks.negative) || 0;
      }
      const t = String(q.type || q.qtype || 'MCQ').toUpperCase();
      return {
        question_id: pid + '_q' + (i + 1),
        question_number: i + 1,
        type: t.includes('NAT') ? 'NAT' : t.includes('MSQ') ? 'MSQ' : 'MCQ',
        section: q.section || 'General',
        marks: pos,
        negative_marks: neg,
        question_html: extractImages(q.question_html || q.text || 'Question', prefix),
        options: extractOptions(q.options || {}, prefix),
        correct_answer: q.correct_answer ?? q.answer ?? null,
        solution_html: extractImages(q.solution_html || q.solution || '', prefix),
      };
    });
    const doc = {
      paper_id: pid,
      title: 'GATE ' + yr + ' Official PYQ Paper (' + (LABEL[br] || br) + ')',
      branch: br,
      provider: 'Official GATE (IIT)',
      series: 'Official Previous Year Papers (PYQ)',
      institute: 'Official GATE (IIT)',
      total_questions: qs.length,
      questions: qs,
    };
    fs.writeFileSync(path.join('public', 'data', 'papers', pid + '.json'), JSON.stringify(doc));
    n++;
    console.log(pid, qs.length + 'Qs', Math.round(Buffer.byteLength(JSON.stringify(doc)) / 1024) + 'KB');
  }
}
console.log('wrote', n, 'papers,', imgCount, 'unique images');
