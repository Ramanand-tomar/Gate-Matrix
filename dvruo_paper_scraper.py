import os
import sys
import re
import json
import argparse
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "https://dvruo-test-series.netlify.app/"
MANIFEST_URL = BASE_URL + "data/series-manifest.js"

sys.stdout.reconfigure(encoding='utf-8')

def fetch_manifest():
    """Fetch and parse window.__SERIES_MANIFEST__ from Netlify site."""
    print(f"Fetching manifest from {MANIFEST_URL}...")
    req = urllib.request.Request(MANIFEST_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8')
    
    json_str = re.sub(r'^window\.__SERIES_MANIFEST__\s*=\s*', '', content.strip())
    json_str = re.sub(r';\s*$', '', json_str)
    manifest = json.loads(json_str)
    return manifest

def parse_paper_html(html_content, paper_meta):
    """Parse single HTML paper page into structured JSON questions."""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    paper_title = soup.title.string.strip() if soup.title else paper_meta.get('title', '')
    q_cards = soup.find_all('section', class_=lambda c: c and 'qcard' in c.lower())
    
    questions = []
    for card in q_cards:
        qnum = card.get('data-qnum', '')
        qtype = card.get('data-qtype', '')
        correct_ans = card.get('data-correct', '')
        nat_low = card.get('data-nat-low', '')
        nat_high = card.get('data-nat-high', '')
        right_marks = card.get('data-right', '')
        wrong_marks = card.get('data-wrong', '')
        
        # Tags & Subject
        tags_el = card.find(class_='tags')
        tags = tags_el.get_text(strip=True) if tags_el else ''
        
        # Question Text
        qtext_el = card.find(class_='qtext')
        qtext_html = str(qtext_el) if qtext_el else ''
        qtext_plain = qtext_el.get_text('\n', strip=True) if qtext_el else ''
        
        # Options
        options = {}
        opts_el = card.find(class_='opts')
        if opts_el:
            for opt_label in opts_el.find_all('label', class_='opt'):
                opt_key = opt_label.get('data-opt', '')
                opt_val_text = opt_label.get_text(strip=True)
                opt_val_html = str(opt_label)
                options[opt_key] = {
                    'text': opt_val_text,
                    'html': opt_val_html
                }
        
        # Answer Line
        ans_el = card.find(class_='answerline')
        answer_text = ans_el.get_text(strip=True) if ans_el else correct_ans
        
        # Solution
        sol_el = card.find('details', class_='solution')
        sol_html = str(sol_el) if sol_el else ''
        sol_plain = sol_el.get_text('\n', strip=True) if sol_el else ''
        
        # Images in question & solution
        q_imgs = [img.get('src') for img in qtext_el.find_all('img') if img.get('src')] if qtext_el else []
        sol_imgs = [img.get('src') for img in sol_el.find_all('img') if img.get('src')] if sol_el else []
        
        q_obj = {
            'qnum': qnum,
            'qtype': qtype,
            'correct_answer': correct_ans,
            'nat_range': {'low': nat_low, 'high': nat_high} if (nat_low or nat_high) else None,
            'marks': {'positive': right_marks, 'negative': wrong_marks},
            'tags': tags,
            'question_text': qtext_plain,
            'question_html': qtext_html,
            'question_images': q_imgs,
            'options': options,
            'answer_text': answer_text,
            'solution_text': sol_plain,
            'solution_html': sol_html,
            'solution_images': sol_imgs
        }
        questions.append(q_obj)
        
    return {
        'title': paper_title,
        'branch': paper_meta.get('branch'),
        'provider': paper_meta.get('provider'),
        'series': paper_meta.get('series'),
        'file_name': paper_meta.get('fileName'),
        'rel_path': paper_meta.get('path'),
        'total_questions': len(questions),
        'questions': questions
    }

def get_out_filepath(paper_meta, output_dir):
    branch_name = re.sub(r'[^\w\-]', '_', paper_meta.get('branch', 'General'))
    branch_dir = os.path.join(output_dir, branch_name)
    raw_filename = paper_meta.get('fileName', 'paper.html')
    if raw_filename.lower().endswith('.html'):
        safe_fname = raw_filename[:-5] + '.json'
    else:
        safe_fname = raw_filename + '.json'
    safe_fname = re.sub(r'[^\w\.\-]', '_', safe_fname)
    return branch_dir, os.path.join(branch_dir, safe_fname)

def process_paper(paper_meta, output_dir="scraped_dataset", skip_existing=True):
    """Download and parse a single paper."""
    branch_dir, out_filepath = get_out_filepath(paper_meta, output_dir)
    
    if skip_existing and os.path.exists(out_filepath) and os.path.getsize(out_filepath) > 500:
        return True, paper_meta.get('fileName'), "SKIPPED (Already exists)"
        
    rel_path = paper_meta.get('path', '')
    url = BASE_URL + urllib.parse.quote(rel_path, safe='/')
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            html_content = resp.read().decode('utf-8')
            
        parsed_data = parse_paper_html(html_content, paper_meta)
        os.makedirs(branch_dir, exist_ok=True)
        
        with open(out_filepath, 'w', encoding='utf-8') as f:
            json.dump(parsed_data, f, ensure_ascii=False, indent=2)
            
        return True, paper_meta.get('fileName'), f"{len(parsed_data['questions'])} questions"
    except Exception as e:
        return False, paper_meta.get('fileName'), str(e)

def scrape_all(branch_filter=None, max_workers=8, limit=None, output_dir="scraped_dataset", skip_existing=True):
    manifest = fetch_manifest()
    all_papers = []
    
    for b in manifest.get('branches', []):
        branch_name = b.get('name')
        if branch_filter and branch_filter.lower() not in branch_name.lower():
            continue
            
        for p in b.get('providers', []):
            provider_name = p.get('name')
            for s in p.get('series', []):
                series_name = s.get('name')
                for test in s.get('tests', []):
                    test_copy = dict(test)
                    test_copy['branch'] = branch_name
                    test_copy['provider'] = provider_name
                    test_copy['series'] = series_name
                    all_papers.append(test_copy)
                    
    print(f"\nMatched papers in manifest: {len(all_papers)}")
    if limit:
        all_papers = all_papers[:limit]
        
    os.makedirs(output_dir, exist_ok=True)
    
    success_count = 0
    fail_count = 0
    skipped_count = 0
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(process_paper, paper, output_dir, skip_existing): paper for paper in all_papers}
        for future in as_completed(futures):
            ok, name, msg = future.result()
            if ok:
                success_count += 1
                if "SKIPPED" in str(msg):
                    skipped_count += 1
                else:
                    print(f"[{success_count}/{len(all_papers)}] Scraped: {name} ({msg})")
            else:
                fail_count += 1
                print(f"[ERROR] Failed: {name} - Reason: {msg}")

    print(f"\n==========================================")
    print(f"Scraping Summary:")
    print(f"  Total processed: {len(all_papers)}")
    print(f"  Already existed (Skipped): {skipped_count}")
    print(f"  Newly Scraped: {success_count - skipped_count}")
    print(f"  Failed: {fail_count}")
    print(f"Dataset location: '{os.path.abspath(output_dir)}'")
    print(f"==========================================")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DVRUO GATE Exam Test Series Dataset Scraper")
    parser.add_argument("--branch", type=str, default=None, help="Filter by branch")
    parser.add_argument("--workers", type=int, default=8, help="Number of concurrent download threads")
    parser.add_argument("--limit", type=int, default=None, help="Limit total papers")
    parser.add_argument("--output", type=str, default="scraped_dataset", help="Output folder name")
    parser.add_argument("--force", action="store_true", help="Overwrite existing scraped files")
    
    args = parser.parse_args()
    scrape_all(
        branch_filter=args.branch, 
        max_workers=args.workers, 
        limit=args.limit, 
        output_dir=args.output,
        skip_existing=not args.force
    )
