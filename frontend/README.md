# SE React Frontend Refactor

This directory contains the React frontend for the SE (1031 Exchange) section of SimpleCITI.

## Tech Stack
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first styling
- **Axios** - HTTP client for API calls

## Project Structure
```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Layout.jsx
│   │   ├── Navigation.jsx
│   │   ├── PropertyCard.jsx
│   │   └── PropertyFilters.jsx
│   ├── pages/           # Page components (routes)
│   │   ├── HomePage.jsx
│   │   ├── Hub.jsx
│   │   ├── DealDetail.jsx
│   │   ├── Pipeline.jsx
│   │   ├── Dashboard.jsx
│   │   └── ...
│   ├── services/        # API integration
│   │   ├── api.js       # Axios instance with auth
│   │   └── apiService.js # API endpoint functions
│   ├── App.jsx          # Main app with routes
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── package.json
├── vite.config.js       # Vite configuration
└── tailwind.config.js   # Tailwind configuration
```

## Development

### Start Dev Server
```bash
cd frontend
npm install
npm run dev
```

The dev server runs on http://localhost:5173 with hot reload.

### Build for Production
```bash
npm run build
```

Builds to `../staticfiles/react/` for Django to serve.

## API Integration

The frontend communicates with Django REST API at `/api/se/`:

- `GET /api/se/properties/` - List properties
- `GET /api/se/properties/{ref}/` - Property detail
- `GET /api/se/pipeline/` - Pipeline properties
- `GET /api/se/exchange-ids/` - User's exchange IDs
- `POST /api/se/enroll-property/` - Enroll property

Authentication uses Django session cookies with CSRF tokens.

## Django Integration

Django serves the React app via the `se_react.html` template:

- **Development**: Proxies to Vite dev server (localhost:5173)
- **Production**: Serves built static files from `staticfiles/react/`

All `/SE/*` routes are handled by React Router on the client side.

## Pages Implemented

✅ **Completed:**
- HomePage - Landing with hero, features, process
- Hub - Property listings with filters
- DealDetail - Single property view
- Navigation - Responsive nav with dropdowns

🚧 **To Complete:**
- Pipeline - Pipeline properties
- Dashboard - Broker property management
- Profile - User profile & settings
- ExchangeEnrollment - Create exchange ID
- ExchangeList - View exchange IDs
- Leadership, Contact, Process, etc.

## Next Steps

1. Run `npm run dev` in frontend directory
2. Run Django dev server: `python manage.py runserver`
3. Visit http://localhost:8000/SE/ to see React app
4. API calls go to http://localhost:8000/api/se/

## Notes

- React Router uses `/SE` as basename
- CSRF tokens automatically included in API requests
- TailwindCSS uses same colors as original templates
- All Django models accessible via REST API
