-- discounts 테이블에 thumbnail 컬럼 추가
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS thumbnail text; 