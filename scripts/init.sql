-- Wendeal Reports Database Initialization Script
-- This script will be run when the PostgreSQL container starts for the first time

-- Ensure the database exists
SELECT 'CREATE DATABASE wendeal_reports'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'wendeal_reports');

-- Set up basic configuration
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create any additional extensions you might need
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
-- CREATE EXTENSION IF NOT EXISTS "unaccent"; -- For accent-insensitive search

-- Note: Prisma migrations will handle the actual table creation
-- This file is just for initial database setup and extensions
