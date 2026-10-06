import os
import sys
import glob
import json
import re
import argparse
import time
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from google.oauth2.credentials import Credentials
from google.cloud import firestore

sys.stdout.reconfigure(encoding='utf-8')

def get_cli_access_token():
    cli_config_path = os.path.expanduser('~/.config/configstore/firebase-tools.json')
    if os.path.exists(cli_config_path):
        try:
            with open(cli_config_path, 'r', encoding='utf-8') as f:
                config_data = json.load(f)
            tokens = config_data.get('tokens', {})
            return tokens.get('access_token')
        except Exception:
            pass
    return None

def refresh_cli_token_via_npx():
    try:
        subprocess.run(["npx.cmd", "firebase-tools", "projects:list"], capture_output=True, timeout=30)
    except Exception:
        pass

def get_firestore_client(project_id="gatematrix-40566", key_path="serviceAccountKey.json"):
    if os.path.exists(key_path):
        print(f"🔑 Using Service Account Key: '{key_path}'", flush=True)
        import firebase_admin
        from firebase_admin import credentials, firestore as fa_db
        if not firebase_admin._apps:
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)
        return fa_db.client()

    token = get_cli_access_token()
    if token:
        print(f"🔐 Using active Firebase CLI Token for project '{project_id}'", flush=True)
        creds = Credentials(token=token)
        return firestore.Client(project=project_id, credentials=creds)

    print("\n❌ Error: Neither serviceAccountKey.json nor active Firebase CLI session found.", flush=True)
    sys.exit(1)

def sanitize_questions(questions, aggressive=False):
    """Clean heavy base64 strings to ensure document size stays under Firestore 1MB limit."""
    cleaned_q = []
    for q in questions:
        q_copy = dict(q)
        # Strip all data:image URLs cleanly
        q_copy['question_html'] = re.sub(r'data:image/[^"\'\s>]+', '[IMAGE]', q_copy.get('question_html', ''))
        q_copy['solution_html'] = re.sub(r'data:image/[^"\'\s>]+', '[IMAGE]', q_copy.get('solution_html', ''))

        # Clean image arrays if present
        if 'question_images' in q_copy:
            q_copy['question_images'] = [re.sub(r'data:image/[^"\'\s>]+', '[IMAGE]', img) for img in q_copy.get('question_images', [])]
        if 'solution_images' in q_copy:
            q_copy['solution_images'] = [re.sub(r'data:image/[^"\'\s>]+', '[IMAGE]', img) for img in q_copy.get('solution_images', [])]

        if aggressive and len(q_copy.get('solution_html', '')) > 1000:
            q_copy['solution_html'] = q_copy['solution_html'][:1000] + '...'

        # Clean images in options
        if 'options' in q_copy and isinstance(q_copy['options'], dict):
            opts = {}
            for key, val in q_copy['options'].items():
                if isinstance(val, dict):
                    opt_copy = dict(val)
                    opt_copy['html'] = re.sub(r'data:image/[^"\'\s>]+', '[IMAGE]', opt_copy.get('html', ''))
                    opts[key] = opt_copy
                else:
                    opts[key] = val
            q_copy['options'] = opts

        cleaned_q.append(q_copy)
    return cleaned_q

def upload_paper_doc(project_id, filepath, skip_existing=True):
    """Uploads entire paper as a single Firestore document containing questions array."""
    paper_id = os.path.basename(filepath).replace('.json', '')
    
    token = get_cli_access_token()
    creds = Credentials(token=token)
    db = firestore.Client(project=project_id, credentials=creds)

    if skip_existing:
        try:
            doc = db.collection('papers').document(paper_id).get()
            if doc.exists and 'questions' in doc.to_dict():
                return True, paper_id, 0, "SKIPPED (Paper doc already in Firestore)"
        except Exception:
            pass

    with open(filepath, 'r', encoding='utf-8') as f:
        paper_data = json.load(f)
        
    branch_name = paper_data.get('branch', 'GENERAL')
    questions = paper_data.get('questions', [])
    
    cleaned_questions = sanitize_questions(questions, aggressive=False)
    
    paper_doc = {
        'paper_id': paper_id,
        'title': paper_data.get('title'),
        'branch': branch_name,
        'provider': paper_data.get('provider'),
        'series': paper_data.get('series'),
        'file_name': paper_data.get('file_name'),
        'rel_path': paper_data.get('rel_path'),
        'total_questions': len(cleaned_questions),
        'questions': cleaned_questions
    }

    # Check payload size (Firestore hard limit is 1,048,576 bytes)
    doc_json = json.dumps(paper_doc, ensure_ascii=False)
    if len(doc_json.encode('utf-8')) > 950000:
        paper_doc['questions'] = sanitize_questions(questions, aggressive=True)

    for attempt in range(5):
        try:
            db.collection('papers').document(paper_id).set(paper_doc)
            return True, paper_id, len(cleaned_questions), "SUCCESS"
        except Exception as e:
            err_str = str(e)
            if "401" in err_str or "UNSUPPORTED" in err_str:
                refresh_cli_token_via_npx()
                token = get_cli_access_token()
                creds = Credentials(token=token)
                db = firestore.Client(project=project_id, credentials=creds)
            if "429" in err_str or "Quota exceeded" in err_str or "ResourceExhausted" in err_str:
                print(f"⚠️ Quota limit hit on {paper_id}, retrying in {(attempt + 1) * 5}s...", flush=True)
                time.sleep((attempt + 1) * 5)
            elif attempt < 4:
                time.sleep((attempt + 1) * 2)
                continue
            else:
                return False, paper_id, 0, err_str
    return False, paper_id, 0, "Max attempts reached"

def upload_dataset_paper_mode(project_id, dataset_dir="scraped_dataset", max_workers=3, skip_existing=True):
    json_files = glob.glob(os.path.join(dataset_dir, "*", "*.json"))
    total_files = len(json_files)
    print(f"\nUploading {total_files} papers as single documents (Uses {total_files} writes) with {max_workers} threads...", flush=True)
    
    success_count = 0
    skipped_count = 0
    fail_count = 0
    total_questions = 0
    
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(upload_paper_doc, project_id, f, skip_existing): f for f in json_files}
        for future in as_completed(futures):
            ok, paper_id, q_count, status = future.result()
            if ok:
                success_count += 1
                if "SKIPPED" in status:
                    skipped_count += 1
                else:
                    total_questions += q_count
                    print(f"[{success_count}/{total_files}] Uploaded: {paper_id} ({q_count} questions)", flush=True)
            else:
                fail_count += 1
                print(f"[ERROR] Failed uploading {paper_id}: {status}", flush=True)

    print("\n========================================================", flush=True)
    print("🎉 Firebase Firestore Paper Dataset Upload Completed!", flush=True)
    print(f"  Total Papers        : {total_files}", flush=True)
    print(f"  Already in DB       : {skipped_count}", flush=True)
    print(f"  Newly Uploaded      : {success_count - skipped_count}", flush=True)
    print(f"  Failed Uploads      : {fail_count}", flush=True)
    print(f"  Questions Uploaded  : {total_questions}", flush=True)
    print(f"  Total Time Taken    : {time.time() - start_time:.1f} seconds", flush=True)
    print("========================================================", flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload GATE Exam Dataset to Firebase Firestore")
    parser.add_argument("--project", type=str, default="gatematrix-40566", help="Firebase Project ID")
    parser.add_argument("--key", type=str, default="serviceAccountKey.json", help="Path to serviceAccountKey.json")
    parser.add_argument("--dataset", type=str, default="scraped_dataset", help="Dataset folder path")
    parser.add_argument("--workers", type=int, default=8, help="Number of parallel upload threads")
    parser.add_argument("--force", action="store_true", help="Re-upload existing documents")
    args = parser.parse_args()
    
    db = get_firestore_client(project_id=args.project, key_path=args.key)
    upload_dataset_paper_mode(args.project, dataset_dir=args.dataset, max_workers=args.workers, skip_existing=not args.force)
