import json
import re
import os

filepath = "scraped_dataset/ELECTRICAL_ENGINEERING/016_Basic_Level_Test-4_Full_Syllabus_GATE_2026_EE.json"
with open(filepath, 'r', encoding='utf-8') as f:
    paper_data = json.load(f)

cleaned_q = []
for q in paper_data['questions']:
    q_copy = dict(q)
    q_copy['question_html'] = re.sub(r'data:image/[^"\'\s>]+', '[IMAGE]', q_copy.get('question_html', ''))
    q_copy['solution_html'] = re.sub(r'data:image/[^"\'\s>]+', '[IMAGE]', q_copy.get('solution_html', ''))
    
    # Strip heavy image array fields!
    if 'question_images' in q_copy:
        q_copy['question_images'] = [re.sub(r'data:image/[^"\'\s>]+', '[IMAGE]', img) for img in q_copy.get('question_images', [])]
    if 'solution_images' in q_copy:
        q_copy['solution_images'] = [re.sub(r'data:image/[^"\'\s>]+', '[IMAGE]', img) for img in q_copy.get('solution_images', [])]
        
    if 'options' in q_copy and isinstance(q_copy['options'], dict):
        opts = {}
        for k, v in q_copy['options'].items():
            if isinstance(v, dict):
                opt_copy = dict(v)
                opt_copy['html'] = re.sub(r'data:image/[^"\'\s>]+', '[IMAGE]', opt_copy.get('html', ''))
                opts[k] = opt_copy
            else:
                opts[k] = v
        q_copy['options'] = opts
    cleaned_q.append(q_copy)

paper_doc = {
    'paper_id': os.path.basename(filepath).replace('.json', ''),
    'title': paper_data.get('title'),
    'branch': paper_data.get('branch', 'GENERAL'),
    'provider': paper_data.get('provider'),
    'series': paper_data.get('series'),
    'file_name': paper_data.get('file_name'),
    'rel_path': paper_data.get('rel_path'),
    'total_questions': len(cleaned_q),
    'questions': cleaned_q
}

payload_bytes = len(json.dumps(paper_doc, ensure_ascii=False).encode('utf-8'))
print(f"Original file size: {os.path.getsize(filepath)} bytes")
print(f"Cleaned payload size: {payload_bytes} bytes (Is < 1MB limit: {payload_bytes < 1000000})")
