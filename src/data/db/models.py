import sqlite3
import os

# Get the absolute path of transit.db
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Gets the directory of the script
DB_PATH = os.path.join(BASE_DIR, '..', 'transit.db')  # Moves up one level to store db in /data/

def create_tables():
    """Creates tables for storing locations in SQLite."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS libraries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT UNIQUE,
            address TEXT,
            latitude REAL,
            longitude REAL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS printers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT UNIQUE,
            description TEXT,
            latitude REAL,
            longitude REAL
        )
    ''')

    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_tables()