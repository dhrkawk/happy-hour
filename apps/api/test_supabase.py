from database import supabase

try:
    print("Attempting to connect to Supabase and list storage buckets...")
    buckets = supabase.storage.list_buckets()
    print("\n✅ Successfully connected to Supabase!")
    print("Storage buckets found:", buckets)
except Exception as e:
    print("\n❌ Failed to connect to Supabase.")
    print(f"Error: {e}")
    print("\nPlease double-check your SUPABASE_URL and SUPABASE_ANON_KEY in the apps/api/.env file.")
