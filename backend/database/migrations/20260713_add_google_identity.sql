ALTER TABLE usuarios
    ADD COLUMN google_sub VARCHAR(255) NULL AFTER email,
    ADD UNIQUE INDEX uq_usuarios_google_sub (google_sub);
