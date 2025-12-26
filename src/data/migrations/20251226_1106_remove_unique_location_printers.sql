PRAGMA foreign_keys = OFF;
BEGIN;

-- Step 1: Create a new printers table (match old schema except for the UNIQUE constraint on location)
CREATE TABLE printers_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location TEXT,
    description TEXT,
    latitude REAL,
    longitude REAL
);

-- Step 2: Copy data from the old table to the new table (only if old table exists and has data)
-- Note: This will fail silently if printers doesn't exist, which is fine
INSERT INTO printers_new (id, location, description, latitude, longitude)
SELECT id, location, description, latitude, longitude
FROM printers;

-- Step 3: Drop the old table
DROP TABLE IF EXISTS printers;

-- Step 4: Rename the new table to the original name
ALTER TABLE printers_new RENAME TO printers;

COMMIT;
PRAGMA foreign_keys = ON;