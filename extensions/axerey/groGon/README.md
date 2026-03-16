# GroGon - U.S.-Manufactured Commercial Drones & Services

**Location**: Davie, Florida  
**Status**: Development Phase

## Overview

GroGon is a U.S.-based commercial drone manufacturer and service provider. We manufacture NDAA-compliant commercial drones to replace banned foreign-made products (DJI, Autel) and provide comprehensive drone services to local markets.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: CSS Modules
- **Deployment**: TBD (Vercel/Netlify/AWS)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The development server will start on `http://localhost:3000`

## Project Structure

```
groGon/
├── src/
│   ├── components/      # Reusable components
│   │   ├── Layout.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── sections/    # Page sections
│   ├── pages/           # Page components
│   │   ├── HomePage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── ServicesPage.tsx
│   │   ├── AboutPage.tsx
│   │   └── ContactPage.tsx
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Features

- ✅ Responsive landing pages
- ✅ Product showcase
- ✅ Services information
- ✅ Contact form
- ✅ About page
- 🔄 E-commerce integration (planned)
- 🔄 Customer portal (planned)
- 🔄 Service booking (planned)

## Next Steps

1. Add form submission handling
2. Integrate with backend API
3. Add analytics
4. SEO optimization
5. Performance optimization
6. Add more interactive features

## License

Proprietary - GroGon

