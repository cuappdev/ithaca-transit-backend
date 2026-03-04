PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS labels (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS printers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    location    TEXT,
    description TEXT,
    latitude    REAL,
    longitude   REAL
);

CREATE TABLE IF NOT EXISTS printer_labels (
    printer_id INTEGER NOT NULL,
    label_id   INTEGER NOT NULL,
    PRIMARY KEY (printer_id, label_id),
    FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id)   REFERENCES labels(id)   ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_forms (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    name              TEXT NOT NULL,
    netid             TEXT NOT NULL,
    event_type        TEXT NOT NULL,
    start_date        DATETIME,
    end_date          DATETIME,
    organization_name TEXT,
    about             TEXT,
    location          TEXT NOT NULL,
    image_url         TEXT,
    approval_status   TEXT NOT NULL DEFAULT 'pending' CHECK(approval_status IN ('pending', 'approved', 'rejected')),
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_event_forms_updated_at
AFTER UPDATE ON event_forms
FOR EACH ROW
BEGIN
  UPDATE event_forms
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;