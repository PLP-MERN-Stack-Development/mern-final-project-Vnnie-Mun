-- AI Crop Doctor Database Schema

-- Users table (admin/extension officers)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Reports table (disease diagnosis records)
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  report_uuid UUID UNIQUE NOT NULL,
  farmer_id_hash VARCHAR(64) NOT NULL, -- hashed WhatsApp ID
  image_url TEXT NOT NULL,
  image_s3_key VARCHAR(255) NOT NULL,
  
  -- Input data
  crop_hint VARCHAR(100),
  user_message TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  
  -- ML Prediction
  predicted_disease VARCHAR(255),
  predicted_disease_sw VARCHAR(255),
  confidence DECIMAL(5, 4),
  severity_score DECIMAL(5, 4),
  advice_en TEXT,
  advice_sw TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'processed',
  needs_human_review BOOLEAN DEFAULT FALSE,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  
  -- Corrections (human-in-loop)
  corrected_disease VARCHAR(255),
  correction_notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Farmer interactions (opt-in/out tracking)
CREATE TABLE IF NOT EXISTS farmer_interactions (
  id SERIAL PRIMARY KEY,
  farmer_id_hash VARCHAR(64) UNIQUE NOT NULL,
  phone_country_code VARCHAR(5),
  opted_in BOOLEAN DEFAULT TRUE,
  consent_given_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_reports INTEGER DEFAULT 0,
  preferred_language VARCHAR(5) DEFAULT 'sw'
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_farmer ON reports(farmer_id_hash);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_review ON reports(needs_human_review) WHERE needs_human_review = TRUE;
CREATE INDEX IF NOT EXISTS idx_farmer_interactions_hash ON farmer_interactions(farmer_id_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Create default admin user (password: admin123 - CHANGE IN PRODUCTION!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@cropdoctor.ke', '$2b$10$rKvqXZZYQYxH0sZGQYxH0eqOqYxH0sZGQYxH0sZGQYxH0sZGQYxH0.', 'System Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;