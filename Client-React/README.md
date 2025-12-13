# AI Outreach Platform - Frontend

Modern React frontend for the AI-powered outreach and meeting automation platform.

## 🚀 Features

- **Landing Page**: Beautiful, animated hero section with waitlist form
- **Admin Dashboard**: Comprehensive management interface
- **Scraping Monitor**: Real-time job tracking
- **Campaign Manager**: AI-powered email campaigns
- **Meeting Scheduler**: Google Calendar integration
- **Lead Database**: Recruiter and student management
- **Analytics Dashboard**: Performance metrics and charts

## 🛠️ Tech Stack

- **React 18** with hooks
- **Vite** for blazing-fast dev experience
- **TailwindCSS** for styling
- **ShadCN/UI** component library
- **Framer Motion** for animations
- **React Query** for data fetching
- **React Router** for navigation
- **Recharts** for data visualization
- **Axios** for API calls

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your backend API URL.

3. **Start development server:**
   ```bash
   npm run dev
   ```

The application will start at `http://localhost:5173`

## 🏗️ Project Structure

```
Client-React/
├── src/
│   ├── components/
│   │   ├── ui/              # ShadCN UI components
│   │   └── layout/          # Dashboard layout
│   ├── pages/               # All page components
│   ├── lib/                 # Utilities and API client
│   ├── App.jsx              # Main app & routes
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🔗 API Integration

The frontend connects to the Express.js backend at `http://localhost:5000/api`.

## 🚀 Build for Production

```bash
npm run build
```

## 📝 License

MIT
