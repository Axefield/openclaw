# GroGon Systems Setup Guide

## Overview

This document outlines the systems architecture and setup for GroGon's backend infrastructure.

## System Components

### 1. API Server (`systems/api/`)

**Purpose**: Main REST API for frontend and integrations

**Tech Stack**:
- Express.js (Node.js/TypeScript)
- PostgreSQL database
- Redis cache
- JWT authentication

**Endpoints** (to be implemented):
- `/api/v1/products` - Product catalog
- `/api/v1/services` - Service offerings
- `/api/v1/orders` - Order management
- `/api/v1/customers` - Customer management
- `/api/v1/jobs` - Service job management
- `/api/v1/flight-plans` - Flight planning
- `/api/v1/manufacturing` - Manufacturing operations

**Setup**:
```bash
cd systems/api
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 2. ERP Integration (`systems/erp/`)

**Purpose**: Integration with ERP system (Odoo/NetSuite)

**Features**:
- Inventory management
- Order processing
- Production tracking
- Supplier management

**Status**: To be implemented

### 3. CRM Integration (`systems/crm/`)

**Purpose**: Integration with CRM system (HubSpot/Salesforce)

**Features**:
- Lead management
- Contact sync
- Sales pipeline
- Marketing automation

**Status**: To be implemented

### 4. Service Management (`systems/services/`)

**Purpose**: Service operations management

**Features**:
- Job scheduling
- Pilot assignment
- Route optimization
- Customer communication

**Status**: To be implemented

### 5. Manufacturing Systems (`systems/manufacturing/`)

**Purpose**: Manufacturing execution and tracking

**Features**:
- Work order management
- Quality control
- Component tracking
- Production metrics

**Status**: To be implemented

### 6. Flight Planning (`systems/flight-planning/`)

**Purpose**: Flight planning and airspace management

**Features**:
- Mission planning
- Airspace checking
- Weather integration
- Compliance verification

**Status**: To be implemented

### 7. Data Processing (`systems/data-processing/`)

**Purpose**: Image/video processing and analysis

**Features**:
- Photogrammetry
- Thermal analysis
- Multispectral processing
- Report generation

**Status**: To be implemented

## Database Schema

### Core Tables

**products**
- id, name, model, price, specifications (JSON), status, created_at, updated_at

**services**
- id, name, description, price, category, status, created_at, updated_at

**customers**
- id, name, email, phone, company, address, type, created_at, updated_at

**orders**
- id, customer_id, type, total, status, created_at, updated_at

**service_jobs**
- id, customer_id, service_id, pilot_id, scheduled_date, status, location, created_at, updated_at

**work_orders**
- id, product_id, quantity, status, priority, created_at, updated_at

**flight_plans**
- id, job_id, mission_type, waypoints (JSON), status, created_at, updated_at

## Development Workflow

1. **Local Development**:
   - API server: `cd systems/api && npm run dev`
   - Frontend: `cd groGon && npm run dev`
   - Database: Local PostgreSQL instance
   - Redis: Local Redis instance

2. **Testing**:
   - Unit tests: `npm test`
   - Integration tests: `npm run test:integration`
   - E2E tests: `npm run test:e2e`

3. **Deployment**:
   - Staging: AWS/Heroku
   - Production: AWS (recommended for aerospace compliance)

## Next Steps

1. Set up PostgreSQL database
2. Create database schema
3. Implement API endpoints
4. Set up authentication
5. Integrate with external services (Airmap, etc.)
6. Deploy to staging environment

