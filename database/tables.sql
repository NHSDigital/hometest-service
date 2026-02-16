SET search_path TO hometest;

-- Patient Mapping
CREATE TABLE IF NOT EXISTS patient_mapping
(
    uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nhs_number varchar(50) UNIQUE,
    birth_date date NOT NULL
);

-- Tests
CREATE TABLE IF NOT EXISTS test_type
(
    test_code varchar(50) PRIMARY KEY,
    description text NOT NULL
);

-- Suppliers and Offerings
CREATE TABLE IF NOT EXISTS supplier
(
    supplier_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    service_url varchar(255) NOT NULL,
    website_url varchar(255),
    client_secret_name varchar(255) NOT NULL,
    client_id varchar(255) NOT NULL,
    oauth_token_path varchar(255),
    order_path varchar(255),
    oauth_scope varchar(255)
);

CREATE TABLE IF NOT EXISTS la_supplier_offering
(
    offering_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id uuid REFERENCES supplier (supplier_id),
    test_code varchar(50) REFERENCES test_type (test_code),
    la_code varchar(10) NOT NULL,
    effective_from timestamp with time zone DEFAULT current_timestamp,

    CONSTRAINT unique_la_offering UNIQUE (la_code, supplier_id, test_code)
);

-- Orders and Statuses
CREATE TABLE IF NOT EXISTS "order"
(
    order_uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_reference bigint GENERATED ALWAYS AS IDENTITY (
        START WITH 100000
    ) UNIQUE,
    supplier_id uuid NOT NULL REFERENCES supplier (supplier_id),
    patient_uid uuid NOT NULL REFERENCES patient_mapping (uid),
    test_code varchar(50) NOT NULL REFERENCES test_type (test_code),
    originator varchar(255),
    created_at timestamp with time zone DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS status_type
(
    status_code varchar(50) PRIMARY KEY,
    description text NOT NULL
);

CREATE TABLE IF NOT EXISTS order_status
(
    status_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_uid uuid NOT NULL REFERENCES "order" (order_uid) ON DELETE CASCADE,
    order_reference bigint,
    status_code varchar(50) NOT NULL REFERENCES status_type (status_code),
    timestamp timestamp with time zone DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS result_status
(
    result_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_uid uuid NOT NULL REFERENCES "order" (order_uid) ON DELETE CASCADE,
    order_reference bigint,
    status_code varchar(50) NOT NULL REFERENCES status_type (status_code),
    timestamp timestamp with time zone DEFAULT current_timestamp
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_patient_uid ON "order" (patient_uid);
CREATE INDEX IF NOT EXISTS idx_order_supplier_id ON "order" (supplier_id);
CREATE INDEX IF NOT EXISTS idx_order_status_order_uid ON order_status (
    order_uid
);
CREATE INDEX IF NOT EXISTS idx_result_status_order_uid ON result_status (
    order_uid
);
CREATE INDEX IF NOT EXISTS idx_patient_nhs_number ON patient_mapping (
    nhs_number
);
