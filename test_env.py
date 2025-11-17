"""Quick test to verify .env is being read"""
from pathlib import Path
from decouple import Config, RepositoryEnv

BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / '.env'

print(f"Looking for .env at: {env_path}")
print(f"File exists: {env_path.exists()}")

if env_path.exists():
    config = Config(RepositoryEnv(str(env_path)))
    db_engine = config('DB_ENGINE', default='NOT_FOUND')
    postgres_name = config('POSTGRES_NAME', default='NOT_FOUND')
    print(f"\nDB_ENGINE = {db_engine}")
    print(f"POSTGRES_NAME = {postgres_name}")
    print(f"POSTGRES_HOST = {config('POSTGRES_HOST', default='NOT_FOUND')}")
else:
    print("ERROR: .env file not found!")
