/**
 * Autonomous Scraper & Normalizer for DVRUO Test Series
 * Scrapes GO Classes, GATE Zeal, and ACE Academy test papers from https://dvruo-test-series.netlify.app
 * and populates scraped_dataset/ and src/lib/data/papers_index.json
 */
const fs = require('fs');
const path = require('path');

const BASE_NETLIFY_URL = 'https://dvruo-test-series.netlify.app';

function resolveRelativeUrls(html, relPath) {
  if (!html) return '';
  let result = html;

  // Resolve ../media/ to absolute Netlify URL based on relPath
  const dirParts = relPath.split('/');
  dirParts.pop(); // remove file name
  const parentDir = dirParts.slice(0, -1).join('/'); // one level up from series folder

  result = result.replace(/src=['"]\.\.\/media\/([^'"]+)['"]/gi, (match, filename) => {
    return `src="${BASE_NETLIFY_URL}/${encodeURI(parentDir)}/media/${filename}"`;
  });

  result = result.replace(/src=['"]\.\.\/\.\.\/media\/([^'"]+)['"]/gi, (match, filename) => {
    const twoUp = dirParts.slice(0, -2).join('/');
    return `src="${BASE_NETLIFY_URL}/${encodeURI(twoUp)}/media/${filename}"`;
  });

  return result;
}

function parseTestSeriesData(testData, paperId, relPath) {
  const sections = (testData.data && testData.data.sections) || [];
  const questions = [];
  let qNum = 1;

  sections.forEach((sec) => {
    (sec.questions || []).forEach((q) => {
      let qType = 'MCQ';
      if (q.type === 'fill_ups' || (q.fillUpsAnswers && q.fillUpsAnswers.length > 0)) {
        qType = 'NAT';
      } else if (q.hasMultipleAnswers || (q.options && q.options.filter((o) => o.isCorrect).length > 1)) {
        qType = 'MSQ';
      }

      const optionsObj = {};
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      const correctLetters = [];

      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, idx) => {
          const letter = letters[idx] || String(idx + 1);
          optionsObj[letter] = {
            html: resolveRelativeUrls(opt.name || opt.nameText || '', relPath),
          };
          if (opt.isCorrect) correctLetters.push(letter);
        });
      }

      let correctAnswer = null;
      if (qType === 'NAT') {
        correctAnswer = (q.fillUpsAnswers && q.fillUpsAnswers[0]) || '';
      } else {
        correctAnswer = correctLetters.join(',');
      }

      let posMarks = 1;
      let negMarks = 0;
      if (q.marks) {
        if (typeof q.marks === 'number') posMarks = q.marks;
        else {
          posMarks = parseFloat(q.marks.positive) || 1;
          negMarks = parseFloat(q.marks.negative) || 0;
        }
      }

      const qHtml = resolveRelativeUrls(q.name || q.nameText || '', relPath);
      const sHtml = resolveRelativeUrls(q.solution || '', relPath);

      questions.push({
        question_id: `${paperId}_q${qNum}`,
        question_number: qNum,
        type: qType,
        section: sec.name || 'General',
        marks: {
          positive: String(posMarks),
          negative: String(negMarks),
        },
        negative_marks: negMarks,
        question_html: qHtml,
        options: optionsObj,
        correct_answer: correctAnswer,
        solution_html: sHtml,
      });
      qNum++;
    });
  });

  return questions;
}

async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

async function scrapeSinglePaper(filePath) {
  const doc = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!doc.rel_path) return { success: false, reason: 'no_rel_path' };

  const url = `${BASE_NETLIFY_URL}/${encodeURI(doc.rel_path)}`;
  const paperId = doc.paper_id || path.basename(filePath, '.json');

  const html = await fetchWithRetry(url);
  const match = html.match(/window\.TEST_SERIES_DATA\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  if (!match) return { success: false, reason: 'no_test_series_data' };

  const rawData = JSON.parse(match[1]);
  const questions = parseTestSeriesData(rawData, paperId, doc.rel_path);

  if (questions.length === 0) return { success: false, reason: 'empty_questions' };

  doc.paper_id = paperId;
  doc.total_questions = questions.length;
  doc.questions = questions;

  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8');
  return { success: true, count: questions.length, paperId };
}

async function runScraper() {
  console.log('🚀 Starting Netlify Paper Scraper for GO Classes, Zeal, and ACE Academy...');

  const baseDir = path.join(process.cwd(), 'scraped_dataset');
  const targetFiles = [];

  for (const branch of fs.readdirSync(baseDir)) {
    const branchDir = path.join(baseDir, branch);
    if (!fs.statSync(branchDir).isDirectory()) continue;
    for (const file of fs.readdirSync(branchDir)) {
      if (!file.endsWith('.json')) continue;
      const fullPath = path.join(branchDir, file);
      try {
        const doc = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        const qCount = (doc.questions || doc.cards || []).length;
        if (qCount === 0 && doc.rel_path) {
          targetFiles.push(fullPath);
        }
      } catch (e) {}
    }
  }

  console.log(`📋 Found ${targetFiles.length} target test papers to scrape.`);

  let successCount = 0;
  let failCount = 0;
  const CONCURRENCY = 15;

  for (let i = 0; i < targetFiles.length; i += CONCURRENCY) {
    const batch = targetFiles.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map((f) => scrapeSinglePaper(f)));

    results.forEach((r, idx) => {
      const fName = path.basename(batch[idx]);
      if (r.status === 'fulfilled' && r.value.success) {
        successCount++;
      } else {
        failCount++;
        const reason = r.status === 'fulfilled' ? r.value.reason : r.reason?.message;
        console.warn(`⚠️ Failed ${fName}: ${reason}`);
      }
    });

    const percent = Math.round(((i + batch.length) / targetFiles.length) * 100);
    process.stdout.write(`\r⏳ Progress: ${Math.min(i + batch.length, targetFiles.length)}/${targetFiles.length} (${percent}%) | Success: ${successCount} | Fail: ${failCount}`);
  }

  console.log(`\n\n🎉 Scraping Completed! Successfully populated ${successCount} papers (Failures: ${failCount}).`);

  // Rebuild papers_index.json with all 1,061 papers
  console.log('🔄 Rebuilding papers_index.json...');
  const allPapers = [];
  for (const branch of fs.readdirSync(baseDir)) {
    const branchDir = path.join(baseDir, branch);
    if (!fs.statSync(branchDir).isDirectory()) continue;
    for (const file of fs.readdirSync(branchDir)) {
      if (!file.endsWith('.json')) continue;
      try {
        const doc = JSON.parse(fs.readFileSync(path.join(branchDir, file), 'utf-8'));
        const qCount = doc.total_questions || (doc.questions || doc.cards || []).length;
        if (qCount > 0) {
          allPapers.push({
            paper_id: doc.paper_id || path.basename(file, '.json'),
            title: doc.title || path.basename(file, '.json'),
            branch: doc.branch || branch,
            provider: doc.provider || 'GATEPrep',
            series: doc.series || 'Test Series',
            total_questions: qCount,
          });
        }
      } catch (e) {}
    }
  }

  const indexPath = path.join(process.cwd(), 'src', 'lib', 'data', 'papers_index.json');
  fs.writeFileSync(indexPath, JSON.stringify(allPapers, null, 2), 'utf-8');
  console.log(`✅ papers_index.json updated with ${allPapers.length} active, playable test papers!`);
}

runScraper().catch((err) => {
  console.error('Fatal error during scrape:', err);
  process.exit(1);
});
