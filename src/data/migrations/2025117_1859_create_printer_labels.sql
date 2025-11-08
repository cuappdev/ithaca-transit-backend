PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS printer_labels (
    printer_id INTEGER NOT NULL,
    label_id   INTEGER NOT NULL,
    PRIMARY KEY (printer_id, label_id),
    FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);