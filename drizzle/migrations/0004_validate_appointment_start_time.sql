CREATE OR REPLACE FUNCTION validate_appointment_start_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_time < NOW() THEN
    RAISE EXCEPTION 'start_time must be in the future';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_appointment_start_time_on_insert
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_start_time();

CREATE TRIGGER validate_appointment_start_time_on_update
  BEFORE UPDATE OF start_time ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_start_time();
