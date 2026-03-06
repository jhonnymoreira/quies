CREATE OR REPLACE FUNCTION prevent_terminal_appointment_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN (
    'completed'::appointment_status,
    'canceled'::appointment_status
    )
  THEN
    -- Block entirely when deleted_at is not changing
    IF NEW.deleted_at IS NOT DISTINCT FROM OLD.deleted_at THEN
      RAISE EXCEPTION 'Cannot update appointment in "%" status', OLD.status;
    END IF;

    -- deleted_at is changing, but block if any other column also changed
    IF (NEW.id, NEW.medspa_id, NEW.start_time, NEW.status,
        NEW.total_duration, NEW.total_price,
        NEW.scheduled_at, NEW.completed_at, NEW.canceled_at,
        NEW.created_at, NEW.updated_at)
       IS DISTINCT FROM
       (OLD.id, OLD.medspa_id, OLD.start_time, OLD.status,
        OLD.total_duration, OLD.total_price,
        OLD.scheduled_at, OLD.completed_at, OLD.canceled_at,
        OLD.created_at, OLD.updated_at)
    THEN
      RAISE EXCEPTION 'Cannot update appointment in "%" status', OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER freeze_terminal_appointments
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_terminal_appointment_update();
