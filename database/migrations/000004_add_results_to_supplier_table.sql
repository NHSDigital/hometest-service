-- +goose Up
ALTER TABLE supplier
ADD COLUMN results_path varchar(255);

UPDATE supplier
SET
  results_path = '/api/results'
WHERE supplier_id = 'c1a2b3c4-1234-4def-8abc-123456789abc';

UPDATE supplier
SET
  results_path = '/nhs_home_test/results'
WHERE supplier_id = 'd2b3c4d5-2345-4abc-8def-23456789abcd';

-- +goose Down
ALTER TABLE supplier
DROP COLUMN IF EXISTS results_path;
