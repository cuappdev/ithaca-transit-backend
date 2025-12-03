PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS event_forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    netid TEXT NOT NULL,
    event_type TEXT NOT NULL,
    start_date DATETIME,
    end_date DATETIME,
    organization_name TEXT,
    about TEXT,
    location TEXT NOT NULL
    approval_status TEXT NOT NULL DEFAULT 'pending' CHECK(approval_status IN ('pending', 'approved', 'rejected'))
);