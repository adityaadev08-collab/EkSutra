import requests
from supabase import create_client, Client
import time

SUPABASE_URL = "https://mlhivbnyuxnvhgrsxghq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGl2Ym55dXhudmhncnN4Z2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxOTkxMTMsImV4cCI6MjEwODc3NTExM30.73PClgVveVISmuNLnsjFHjxd8ZzGv8sYgivycOdcs8s"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
total_fetched = 0
page_size = 100 
max_schemes = 5145 # The total amount

print("Starting bulk extraction...")

# Loop through the pages
for offset in range(0, max_schemes, page_size):
    # Notice how the URL now dynamically updates the &from= and &size= parameters
    api_url = f"https://www.myscheme.gov.in/api/apisetu/search/schemes?lang=en&q=%5B%5D&keyword=&sort=&from={offset}&size={page_size}"
    
    response = requests.get(api_url, headers=headers)
    data = response.json()
    raw_items = data.get('data', {}).get('hits', {}).get('items', [])
    
    if not raw_items:
        break
        
    formatted_schemes = []
    for item in raw_items:
        fields = item.get('fields', {})
        formatted_schemes.append({
            "title": fields.get('schemeName', 'Unknown Scheme'),
            "department": fields.get('nodalMinistryName', 'Government of India'),
            "description": fields.get('briefDescription', 'No description'),
            "min_age": 18,
            "max_age": 60, 
            "max_income": 300000, 
            "target_occupation": "Any",
            "apply_url": f"https://www.myscheme.gov.in/schemes/{fields.get('slug', '')}"
        })
    
    # Upload this batch of 100
    supabase.table('services').insert(formatted_schemes).execute()
    total_fetched += len(formatted_schemes)
    print(f"Uploaded {total_fetched} schemes so far...")
    time.sleep(1) # Be polite to the server to avoid getting blocked

print("Success! Database fully loaded.")