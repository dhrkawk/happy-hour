-- stores 테이블에 category 컬럼 추가
ALTER TABLE stores ADD COLUMN IF NOT EXISTS category varchar NOT NULL DEFAULT ''; 