import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "data", "transit.db");

function fetchAllLibraries() {
  return new Promise((resolve, reject) => {
    // Open the database
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      // console.log("Connected to the SQLite database.");
    });

    // Fetch libraries
    db.all("SELECT * FROM libraries", (err, rows) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      db.close((err) => {
        if (err) console.error(err.message);
        // console.log("Closed the database connection.");
      });

      resolve(rows);
    });
  });
}

function fetchAllPrinters() {
  return new Promise((resolve, reject) => {
    // Open the database
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      // console.log("Connected to the SQLite database.");
    });

    // Fetch printers
    db.all("SELECT p.id, p.location, p.description, p.latitude, p.longitude, COALESCE(GROUP_CONCAT(DISTINCT l.label, ', '), '') AS labels FROM printers p LEFT JOIN printer_labels pl ON p.id = pl.printer_id LEFT JOIN labels l ON pl.label_id = l.id GROUP BY p.id", (err, rows) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      db.close((err) => {
        if (err) console.error(err.message);
        // console.log("Closed the database connection.");
      });

      resolve(rows);
    });
  });
}

export default { fetchAllLibraries, fetchAllPrinters };
