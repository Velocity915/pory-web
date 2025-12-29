# Pory-Web

A Pokémon collection tracker web app that lets users track their caught Pokémon, including shinies. Built with React and FastAPI.

**Live Demo:** https://velocity915.github.io/pory-web

## Features

- Track your Pokémon collection by Pokédex number
- Mark Pokémon as shiny or regular
- Sort collection by number or name (ascending/descending)
- User authentication (register/login)
- Admin panel for user management
- Pokémon sprites from PokéAPI

## Tech Stack

**Frontend:**
- React 19
- pokedex-promise-v2 (PokéAPI wrapper)
- Deployed on GitHub Pages

**Backend:**
- FastAPI (Python)
- SQLite database
- JWT authentication
- bcrypt password hashing

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python 3.8+
- npm

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app runs at http://localhost:3000

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --reload
```

The API runs at http://localhost:8000

### Default Admin Account

- **Username:** admin
- **Password:** admin123

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run development server |
| `npm run build` | Build for production |
| `npm run deploy` | Deploy to GitHub Pages |
| `npm test` | Run tests |

## Environment Variables

### Frontend
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8000)

### Backend
- `SECRET_KEY` - JWT secret key
- `ADMIN_USERNAME` - Admin username (default: admin)
- `ADMIN_PASSWORD` - Admin password (default: admin123)

## Project Structure

```
pory-web/
├── src/
│   ├── App.js          # Main app component
│   ├── Auth.js         # Login/Register component
│   ├── AdminPanel.js   # Admin dashboard
│   ├── api.js          # API client
│   └── App.css         # Styles
├── backend/
│   ├── main.py         # FastAPI server
│   ├── requirements.txt
│   └── pory.db         # SQLite database
└── package.json
```

## License

MIT
