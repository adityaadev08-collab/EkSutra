import json
from supabase import create_client, Client

url  = "https://mlhivbnyuxnvhgrsxghq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGl2Ym55dXhudmhncnN4Z2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxOTkxMTMsImV4cCI6MjEwODc3NTExM30.73PClgVveVISmuNLnsjFHjxd8ZzGv8sYgivycOdcs8s"
supabase: Client = create_client(url, SUPABASE_KEY)

# Ensure this matches your downloaded filename exactly
with open('real_data.json', 'r', encoding='utf-8') as f:
    items = json.load(f).get('data', {}).get('hits', {}).get('items', [])

print(f"Patching {len(items)} scheme URLs... this will take a few minutes.")

for item in items:
    fields = item.get('fields', {})
    title = fields.get('schemeName')
    slug = fields.get('slug')
    
    if title and slug:
        correct_url = f"https://www.myscheme.gov.in/schemes/{slug}"
        try:
            supabase.table('services').update({"apply_url": correct_url}).eq('title', title).execute()
        except Exception as e:
            pass 

print("✅ All URLs successfully patched to their specific scheme pages!")