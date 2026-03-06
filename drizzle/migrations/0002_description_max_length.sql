ALTER TABLE services ADD CONSTRAINT services_description_max_length CHECK (length(description) <= 500);
