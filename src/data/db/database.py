import sqlite3
import os

# Get the absolute path of transit.db
BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)  # Gets the directory of the script
DB_PATH = os.path.join(
    BASE_DIR, "..", "transit.db"
)  # Moves up one level to store db in /data/


def get_db_connection():
    """Establish and return an SQLite connection."""
    return sqlite3.connect(DB_PATH)


def insert_library(location, address, latitude, longitude):
    """Insert a library into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT OR IGNORE INTO libraries (location, address, latitude, longitude)
        VALUES (?, ?, ?, ?)
    """,
        (location, address, latitude, longitude),
    )

    conn.commit()
    conn.close()


def insert_printer(location, description, latitude, longitude):
    """Insert a printer into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT OR IGNORE INTO printers (location, description, latitude, longitude)
        VALUES (?, ?, ?, ?)
    """,
        (location, description, latitude, longitude),
    )

    conn.commit()
    conn.close()


def insert_report(vehicle_id, congestion_level, device_token, timestamp=None):
    """Insert a report into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if timestamp:
        cursor.execute(
            """
            INSERT INTO reports (timestamp, vehicleID, congestionLevel, deviceToken)
            VALUES (?, ?, ?, ?, ?)
        """,
            (timestamp, vehicle_id, congestion_level, device_token),
        )
    else:
        cursor.execute(
            """
            INSERT INTO reports (vehicleID, congestionLevel, deviceToken)
            VALUES (?, ?, ?, ?)
        """,
            (vehicle_id, congestion_level, device_token),
        )

    conn.commit()
    conn.close()
