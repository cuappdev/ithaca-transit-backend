// Imports necessary for data migrations
const fs = require('fs'); // Node's built-in file system module, which lets us read from disk 
const path = require('path'); // Safer way to express file paths/path joining
const crypto = require('crypto');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, "../transit.db"); // Finds db file from current file's directory
const MIGRATIONS_DIR = path.join(__dirname, "../migrations");

/**
 * Hashes a string using SHA-256
 * 
 * We use this to store the checksum of the migration file in the database.
 * This allows us to track which migrations have been applied, as well as if a migration file has been modified since it was last applied.
 * 
 * @param {string} s - The string to hash
 * @returns {string} - The SHA-256 hash of the string
 */
function sha256(s) {
    return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

/**
 * Runs the migrations
 * 
 * This function reads all the migration files in the migrations directory, hashes them, and stores the checksum in the database.
 * It then executes the migrations in the order of the files.
 * 
 * @returns {void}
 * @throws {Error} - If the migrations fail
 */
function runMigration() {
    // Open the database using the better-sqlite3 library
    const db = new Database(DB_PATH);
    
    // Set defaults for migrations
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');

    // Create the schema_migrations table if it doesn't exist for tracking migrations applied to the database
    db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id INTEGER PRIMARY KEY,
            filename TEXT NOT NULL UNIQUE,
            checksum TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `);

    // Get the list of migrations that have already been applied to the database
    const applied = new Set(
        db.prepare('SELECT filename FROM schema_migrations').all().map(record => record.filename)
    );

    // Get the list of migration files in the migrations directory (keeping only .sql files and sorting them chronologically)
    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();

    // Prepare the statement to insert a new migration into the schema_migrations table
    const insertMig = db.prepare(`
        INSERT INTO schema_migrations (filename, checksum) VALUES (?,?)
    `);

    // Define a transaction to execute the migrations
    const transaction = db.transaction(() => {
        for (const file of files) {
            // Skip if the migration has already been applied
            if (applied.has(file)) {
                continue;
            }
            
            const full = path.join(MIGRATIONS_DIR, file);
            const sql = fs.readFileSync(full, 'utf8').trim();
            if (!sql) {
                continue;
            }

            // Defensive: re-enable FKs inside each run (is already done in the migrations, but just in case)
            db.exec('PRAGMA foreign_keys = ON;');

            // Execute SQL commands in the migration file
            db.exec(sql);

            // Records migration as applied to the database via its check
            insertMig.run(file, sha256(sql));
            console.log(`Applied ${file}`);
        }
    });

    try {
        transaction();
        console.log('All migrations applied');
    } catch (e) {
        console.error("Migration failed", e);
    } finally {
        db.close();
    }
}

runMigration();