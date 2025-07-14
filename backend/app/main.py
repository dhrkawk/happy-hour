from fastapi import FastAPI
from dotenv import load_dotenv
import os
from supabase import create_client, Client

load_dotenv()

app = FastAPI()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase URL and Key must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/test-supabase")
async def test_supabase():
    try:
        response = supabase.from_("your_table_name").select("*").limit(1).execute()
        return {"message": "Supabase connection successful", "data": response.data}
    except Exception as e:
        return {"message": "Supabase connection failed", "error": str(e)}
