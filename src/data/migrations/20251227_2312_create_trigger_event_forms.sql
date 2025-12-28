CREATE TRIGGER trg_event_forms_updated_at
AFTER UPDATE ON event_forms
FOR EACH ROW
BEGIN
  UPDATE event_forms
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;