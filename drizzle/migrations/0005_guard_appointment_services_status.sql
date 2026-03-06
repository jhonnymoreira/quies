CREATE OR REPLACE FUNCTION guard_appointment_services_status()
RETURNS TRIGGER AS $$
DECLARE
  appointment_status appointment_status;
BEGIN
  SELECT status INTO appointment_status
  FROM appointments
  WHERE id = COALESCE(NEW.appointment_id, OLD.appointment_id);

  IF appointment_status IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  IF appointment_status != 'scheduled' THEN
    RAISE EXCEPTION 'Cannot modify services for appointment in "%" status', appointment_status;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guard_appointment_services_on_insert
  BEFORE INSERT ON appointments_services
  FOR EACH ROW
  EXECUTE FUNCTION guard_appointment_services_status();

CREATE TRIGGER guard_appointment_services_on_delete
  BEFORE DELETE ON appointments_services
  FOR EACH ROW
  EXECUTE FUNCTION guard_appointment_services_status();
