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


def insert_printer(location, description, labels, latitude, longitude):
    """Insert a printer into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # We remove the "OR IGNORE" because we acknoledge that several printers may have the same location and description (i.e., same building and room), so we rely on the unique printer_id to identify the printer
    cursor.execute(
        """
        INSERT INTO printers (location, description, latitude, longitude)
        VALUES (?, ?, ?, ?)
    """,
        (location, description, latitude, longitude),
    )

    # To get the printer_id, we do NOT rely on the location/description/coordinates, but rather on the printer_id that was just inserted (lastrowid), as several printers may have the same location and description (i.e., same building and room)
    printer_id = cursor.lastrowid

    # Insert labels into the labels table and get their IDs
    label_ids = []
    for label in labels:
        cursor.execute(
            """
            INSERT OR IGNORE INTO labels (label)
            VALUES (?)
        """,
            (label,),
        )
        cursor.execute(
            """
            SELECT id FROM labels WHERE label = ?
        """,
            (label,),
        )
        result = cursor.fetchone()
        if result is None:
            raise ValueError(f"Failed to find label: {label}")
        label_id = result[0]
        label_ids.append(label_id)

    # Insert into junction table
    for label_id in label_ids:
        cursor.execute(
            """
            INSERT OR IGNORE INTO printer_labels (printer_id, label_id)
            VALUES (?, ?)
        """,
            (printer_id, label_id),
        )

    conn.commit()
    conn.close()
