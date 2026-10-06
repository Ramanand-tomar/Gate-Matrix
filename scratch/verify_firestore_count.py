import json
import os
from google.cloud import firestore
from google.oauth2.credentials import Credentials

def get_cli_access_token():
    cli_config_path = os.path.expanduser('~/.config/configstore/firebase-tools.json')
    if os.path.exists(cli_config_path):
        with open(cli_config_path, 'r', encoding='utf-8') as f:
            return json.load(f).get('tokens', {}).get('access_token')
    return None

token = get_cli_access_token()
db = firestore.Client(project="gatematrix-40566", credentials=Credentials(token=token))

docs = list(db.collection('papers').select(['paper_id', 'branch', 'total_questions']).stream())
print(f"Total Papers in Firestore: {len(docs)}")

branches = {}
for d in docs:
    data = d.to_dict()
    b = data.get('branch', 'UNKNOWN')
    branches[b] = branches.get(b, 0) + 1

for b, count in sorted(branches.items()):
    print(f"  - {b}: {count} papers")
