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
    db.all("SELECT * FROM printers", (err, rows) => {
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

function fetchAllRestaurants() {
  return new Promise((resolve, reject) => {
    // Open the database
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      console.log("Connected to the SQLite database.");
    });

    // Fetch printers
    db.all("SELECT * FROM restaurants", (err, rows) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      db.close((err) => {
        if (err) console.error(err.message);
        console.log("Closed the database connection.");
      });

      resolve(rows);
    });
  });
}

export default { fetchAllLibraries, fetchAllPrinters, fetchAllRestaurants };
