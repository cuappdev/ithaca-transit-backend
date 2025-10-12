import sqlite3
import os

# Get the absolute path of transit.db
BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)  # Gets the directory of the script
DB_PATH = os.path.join(
    BASE_DIR, "..", "transit.db"
)  # Moves up one level to store db in /data/


def create_tables():
    """Creates tables for storing locations in SQLite."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    #TODO: Remove UNIQUE constraint from location
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS libraries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT UNIQUE,
            address TEXT,
            latitude REAL,
            longitude REAL
        )
    """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS printers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT UNIQUE,
            description TEXT,
            latitude REAL,
            longitude REAL
        )
    """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            vehicleID TEXT,
            congestionLevel TEXT,
            deviceToken TEXT
        )
    """
    )
    
    # Table for storing unique labels
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS labels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT UNIQUE NOT NULL
        )
    """
    )

    # Junction table for many-to-many relationship between printers and labels
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS printer_labels (
            printer_id INTEGER NOT NULL,
            label_id   INTEGER NOT NULL,
            PRIMARY KEY (printer_id, label_id),
            FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE CASCADE,
            FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
        )
    """
    )

    conn.commit()
    conn.close()


if __name__ == "__main__":
    create_tables()
