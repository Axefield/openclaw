# GroGon Setup Guide

## Quick Start

### 1. Frontend (Landing Pages)

```bash
cd groGon
npm install
npm run dev
```

Visit: http://localhost:3000

### 2. Backend API

```bash
cd systems/api
npm install
# Create .env file (see systems/api/.env.example)
npm run dev
```

Visit: http://localhost:3001

## What's Been Created

### ✅ Frontend (React + TypeScript)
- Complete landing pages (Home, Products, Services, About, Contact)
- Responsive design
- All pitch deck content converted to web pages
- Modern UI with CSS

### ✅ Backend API (Express + TypeScript)
- Basic API server structure
- Health check endpoint
- TypeScript configuration
- Ready for expansion

### ✅ Shared Types
- Complete TypeScript type definitions
- Product, Service, Order, Customer types
- Manufacturing, Service Job types
- Flight Planning types

## Next Steps

1. **Install Dependencies**:
   ```bash
   cd groGon
   npm install
   ```

2. **Start Development**:
   ```bash
   npm run dev
   ```

3. **Set Up Backend** (when ready):
   ```bash
   cd systems/api
   npm install
   # Configure .env
   npm run dev
   ```

4. **Customize**:
   - Update colors in `src/index.css`
   - Add logo/images
   - Connect contact form to backend
   - Add analytics

## File Structure

```
groGon/
├── src/                    # Frontend React app
│   ├── pages/              # Landing pages
│   ├── components/         # Reusable components
│   └── ...
├── systems/                # Backend systems
│   ├── api/                # API server
│   ├── shared/             # Shared types
│   └── ...
├── package.json            # Frontend dependencies
└── README.md
```

## Features Implemented

- ✅ Homepage with all pitch deck sections
- ✅ Products page with 4 drone models
- ✅ Services page with 5 service offerings
- ✅ About page
- ✅ Contact form
- ✅ Responsive navigation
- ✅ Modern, professional design
- ✅ TypeScript throughout
- ✅ API server foundation

## Ready to Deploy

The frontend is ready to deploy to:
- Vercel (recommended for React)
- Netlify
- AWS Amplify
- Any static hosting

The backend API can be deployed to:
- AWS (recommended)
- Heroku
- Railway
- DigitalOcean

