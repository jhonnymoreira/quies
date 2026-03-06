CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I.%I SET deleted_at = NOW() WHERE id = $1',
    TG_TABLE_SCHEMA, TG_TABLE_NAME
  ) USING OLD.id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER soft_delete_on_medspas
  BEFORE DELETE ON medspas
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete();

CREATE TRIGGER soft_delete_on_services
  BEFORE DELETE ON services
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete();

CREATE TRIGGER soft_delete_on_appointments
  BEFORE DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete();
