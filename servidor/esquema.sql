-- Rumbo's own database (DAT-03). Every document is stored as the page sent it (DAT-05): the server never renames,
-- drops or retypes a field. Applied on every start; only additive, idempotent statements go here.
CREATE TABLE IF NOT EXISTS principal (
    persona     text        PRIMARY KEY,
    datos       jsonb       NOT NULL,
    actualizado timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS docs (
    persona     text        NOT NULL,
    col         text        NOT NULL,
    id          text        NOT NULL,
    datos       jsonb       NOT NULL,
    actualizado timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (persona, col, id)
);
