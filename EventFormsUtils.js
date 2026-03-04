import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "data", "transit.db");

const ALLOWED_EVENT_TYPES = ['temporary', 'permanent'];
const ALLOWED_APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];

/**
 * Creates an event form in the database.
 * 
 * @param eventForm - The event form to create.
 * @returns {Promise<Object>} - The created event form.
 * @throws {Error} - If the event form is invalid.
 * @throws {Error} - If the database connection fails.
 */

function createEventForm({ netid, name, eventType, startDate = null, endDate = null, organizationName = null, location, about = null, image_url }) {
  // Safety checks - make sure the event form is valid
  if (!netid || !name || !eventType || !location) {
    throw new Error("Invalid event form — netid, name, event type, and location are required");
  };
  
  // Ensures event type is valid
  // if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
  //   throw new Error('Invalid event form — event type invalid');
  // }

  // Handle event types
  if (eventType == 'temporary') {
    // If the event is temporary (e.g., tabling), then we require event's date(s) and times, and name of the hosting organization
    if (!startDate || !endDate) {
        // NOTE: The start and end dates are required for temporary events
        throw new Error("Invalid event form — start and end dates are required for temporary events");
    }
    if (!organizationName) {
      // NOTE: The organization name is required for temporary events
      throw new Error("Invalid event form — organization name is required for temporary events");
    }
  }

  // Create the event form
  const eventForm = {
    netid,
    name,
    eventType,
    startDate,
    endDate,
    organizationName,
    location,
    image_url,
    about,
    approvalStatus: 'pending'
  };

  return new Promise((resolve, reject) => {
      // Open the database
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error(err.message);
            return reject(err);
        }
      });

      // Prepare the query
      const query = `INSERT INTO event_forms (name, netid, event_type, start_date, end_date, organization_name, location, approval_status, about, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const values = [eventForm.name, eventForm.netid, eventForm.eventType, eventForm.startDate, eventForm.endDate, eventForm.organizationName, eventForm.location, eventForm.approvalStatus, eventForm.about, eventForm.image_url];

      // Insert the event form into the database
      db.run(query, values, function (err) {
        if (err) {
          db.close();
          console.error(err.message);
          return reject(err);
        }

        // Get the inserted event form
        db.get(`SELECT * FROM event_forms WHERE id = ?`, [this.lastID], (err, row) => {
          db.close();
          if (err) {
            console.error(err.message);
            return reject(err);
          }
          return resolve(row);
        });
      });
  });
}

/**
 * Gets all event forms from the database.
 * 
 * @returns {Promise<Array<Object>>} - The event forms.
 * @throws {Error} - If the database connection fails.
 */
function getAllEventForms() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
    });

    // Prepare the query
    const query = `SELECT * FROM event_forms`;
    db.all(query, (err, rows) => {
      db.close();
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      return resolve(rows);
    });
  });
}

/**
 * Updates the approval status of a specified event form in the database.
 * 
 * Allowed approval statuses are: 'pending', 'approved', 'rejected'.
 * 
 * @param integer id - The id of the event form to update.
 * @param {Object} approvalStatus - The approval status to update the event form to.
 * @returns {Promise<Object>} - The updated event form.
 * @throws {Error} - If the event form is invalid or the approval status is invalid.
 * @throws {Error} - If the event form is not found.
 */
function updateEventForm({ id, approvalStatus }) {
  // Safety checks - make sure the event form is valid
  if (!id || !approvalStatus) throw new Error("Invalid event form — id and approval status are required");
  // Ensures approval status is valid
  if (!ALLOWED_APPROVAL_STATUSES.includes(approvalStatus)) {
    throw new Error('Invalid event form — approval status invalid');
  }

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
    });

    // Prepare the query
    const query = `UPDATE event_forms SET approval_status = ? WHERE id = ?`;
    const values = [approvalStatus, id];

    // Update the event form in the database
    db.run(query, values, function (err) {
      if (err) {
        db.close();
        console.error(err.message);
        return reject(err);
      }

      // Checks if there were no updates to the event form (in which case, there was an error)
      if (this.changes === 0) {
        db.close();
        return reject(new Error("Event form not found"));
      }

      // Get the updated event form
      db.get(`SELECT * FROM event_forms WHERE id = ?`, [id], (err, row) => {
        db.close();
        if (err) {
          console.error(err.message);
          return reject(err);
        }
        return resolve(row);
      });
    });
  });
}

/**
 * Gets all approved event forms from the database.
 * 
 * @returns {Promise<Array<Object>>} - The approved event forms.
 * @throws {Error} - If the database connection fails.
 */
function getApprovedEventForms() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
    });

    // Prepare the query
    const query = `SELECT * FROM event_forms WHERE approval_status = 'approved'`;
    db.all(query, (err, rows) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      resolve(rows);
    });

    // Close the database
    db.close((err) => {
      if (err) console.error(err.message);
      });
  });
}

  /**
 * Gets all event forms matching a specific netID from the database.
 * 
 * @param {Object} netID - netID, kept as netID to prevent 
 * @returns {Object} - The events matching the netid or a message stateing that there are no matching events to that netid.
 */
function eventsByNetid(netID) {
  //check if a netid was passed in
  if (!netID) throw new Error("Invalid netid — non-null netid is required");

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
    });

    // Prepare the query
    const query = `SELECT * FROM event_forms WHERE netid = ?`;
    db.all(query, [netID],(err, rows) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      db.close((err) => { //close the database
      if (err) console.error(err.message);
      });

      resolve(rows);
    });
  });
  
  }

    /**
 * Gets an image url by the form id
 * 
 * @param {Object} id - id
 * @returns {Object} - The image url matching to the specific form, or no url found if there form contains no url
 */
function getImageByFormId(ID) {
  //check if a ID was passed in
  if (!ID) throw new Error("Invalid id — non-null id is required");
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
    });

    // Prepare the query
    const query = `SELECT image_url FROM event_forms WHERE id = ?`;
    db.get(query, [ID],(err, rows) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      db.close((err) => { //close the database
      if (err) console.error(err.message);
      });

      resolve(rows);
    });
  });
  
  }


/**
 * Converts an event form to a public event.
 * 
 * @param {Object} eventForm - The event form to convert.
 * @returns {Object} - The public event.
 */
function toPublicEvent({ name, netid, eventType, startDate, endDate, organizationName, about, location, image_url }) {
  return {
    name,
    netid,
    eventType,
    startDate,
    endDate,
    organizationName,
    about,
    location,
    image_url
  }
}

export { createEventForm, getAllEventForms, updateEventForm, getApprovedEventForms, toPublicEvent, eventsByNetid, getImageByFormId};