import sqlite3
import os

# Get the absolute path of transit.db
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Gets the directory of the script
DB_PATH = os.path.join(BASE_DIR, '..', 'transit.db')  # Moves up one level to store db in /data/

def get_db_connection():
    """Establish and return an SQLite connection."""
    return sqlite3.connect(DB_PATH)

def insert_library(location, address, latitude, longitude):
    """Insert a library into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT OR IGNORE INTO libraries (location, address, latitude, longitude)
        VALUES (?, ?, ?, ?)
    ''', (location, address, latitude, longitude))

    conn.commit()
    conn.close()

def insert_printer(location, description, latitude, longitude):
    """Insert a printer into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT OR IGNORE INTO printers (location, description, latitude, longitude)
        VALUES (?, ?, ?, ?)
    ''', (location, description, latitude, longitude))

    conn.commit()
    conn.close()

def insert_restaurant(name, category, address, latitude, longitude, image_url, web_url):
    """Insert a restaurant into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT OR IGNORE INTO restaurants (name, category, address, latitude, longitude, image_url, web_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (name, category, address, latitude, longitude, image_url, web_url))

    conn.commit()
    conn.close()