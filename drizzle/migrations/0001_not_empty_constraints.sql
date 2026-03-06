ALTER TABLE medspas ADD CONSTRAINT medspas_name_not_empty CHECK (length(trim(name)) > 0);
ALTER TABLE medspas ADD CONSTRAINT medspas_address_not_empty CHECK (length(trim(address)) > 0);
ALTER TABLE medspas ADD CONSTRAINT medspas_phone_number_not_empty CHECK (length(trim(phone_number)) > 0);
ALTER TABLE medspas ADD CONSTRAINT medspas_email_not_empty CHECK (length(trim(email)) > 0);
ALTER TABLE services ADD CONSTRAINT services_name_not_empty CHECK (length(trim(name)) > 0);
ALTER TABLE services ADD CONSTRAINT services_description_not_empty CHECK (length(trim(description)) > 0);
