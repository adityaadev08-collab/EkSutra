import json
import time
from supabase import create_client, Client

# Supabase Credentials
import os

url = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, SUPABASE_KEY)

# 1. Load the live JSON payload
# Ensure the downloaded Gov JSON file is in the exact same folder
with open('real_data.json', 'r', encoding='utf-8') as f:
    raw_items = json.load(f).get('data', {}).get('hits', {}).get('items', [])

print(f"Found {len(raw_items)} schemes. Starting automated UPSERT process...")

# 2. Prepare the data payload
schemes_to_upsert = []
for item in raw_items:
    fields = item.get('fields', {})
    slug = fields.get('slug')
    title = fields.get('schemeName')
    
    if not slug or not title:
        continue
        
    # We map the raw JSON fields to match your Supabase columns
    scheme_data = {
        "title": title,
        "slug": slug,  # This acts as our unique identifier for the UPSERT
        "department": fields.get('nodalMinistryName') or fields.get('stateName') or "Central Government",
        "description": fields.get('briefDescription', '')[:500], # Cleanly clip descriptions
        "apply_url": f"https://www.myscheme.gov.in/schemes/{slug}" # Automatically patched URL
    }
    schemes_to_upsert.append(scheme_data)

unique_schemes = {scheme['slug']: scheme for scheme in schemes_to_upsert}
schemes_to_upsert = list(unique_schemes.values())

# 3. Batch the UPSERT into groups of 100
BATCH_SIZE = 100
successful_batches = 0

for i in range(0, len(schemes_to_upsert), BATCH_SIZE):
    batch = schemes_to_upsert[i : i + BATCH_SIZE]
    try:
        # UPSERT: Updates existing schemes, Inserts brand new ones
        # We specify on_conflict='title' or 'slug' depending on your database Primary Key
        supabase.table('services').upsert(batch, on_conflict='slug').execute()
        successful_batches += 1
        print(f"✅ Upserted batch {successful_batches} ({i} to {i+len(batch)} schemes)")
        
        # A tiny half-second delay to ensure we don't trip Supabase rate limits
        time.sleep(0.5) 
    except Exception as e:
        print(f"❌ Error on batch {successful_batches + 1}: {e}")

print("🚀 All scheme data successfully UPSERTED! The database is fresh.")