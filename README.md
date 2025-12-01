# Qatar Events Aggregator 🎭

A modern web application that aggregates events from top Qatar websites including **ILoveQatar**, **Qatar Museums**, and **Visit Qatar**. Discover the best events happening in Qatar with a beautiful, user-friendly interface.

![Qatar Events Aggregator](https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200)

## Features

✨ **Multi-Source Aggregation** - Combines events from **ILoveQatar**, **Qatar Museums**, and **Visit Qatar**  
🤖 **AI Category Classification** - Uses Gemini AI to clean and standardize event categories  
🎨 **Snoonu B2B Branding** - Premium UI with Snoonu's red/white/black identity and Inter typography  
🌓 **Light/Dark Mode** - Toggle between light and dark themes based on your preference  
📱 **Modern UI/UX** - Quick action date filters, collapsible category sidebar, and smooth animations  
🔍 **Smart Filtering** - Filter by "Today", "This Week", "This Month", or specific categories  
🔄 **Auto-Refresh** - Automatically scrapes events every 6 hours  
⚡ **Fast & Efficient** - Built with performance in mind

## Technology Stack

### Backend
- **Node.js** with Express.js
- **Axios** for HTTP requests
- **Cheerio** for web scraping
- **Gemini AI** for category classification
- **node-cron** for scheduled tasks

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Modern CSS** - Custom design system with CSS variables and Snoonu branding
- **Responsive Design** - Mobile-first approach with collapsible sidebar

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. **Clone or navigate to the project directory**
```bash
cd qatar-events-aggregator
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm start
```

4. **Open your browser**
Navigate to `http://localhost:3000`

## Development

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### GET `/api/events`
Get all events with optional filtering.

**Query Parameters:**
- `range` - Filter by date range: `today`, `week`, `month`, or `all` (default: `all`)
- `category` - Filter by category (optional)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "events": [...],
  "lastUpdate": "2025-11-30T09:27:00.000Z"
}
```

### GET `/api/categories`
Get all available event categories.

**Response:**
```json
{
  "success": true,
  "categories": ["Arts & Culture", "Music & Concerts", "Sports & Fitness", ...]
}
```

### GET `/api/stats`
Get aggregator statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalEvents": 15,
    "eventsBySource": {...},
    "lastScrapingTime": "2025-11-30T09:27:00.000Z",
    "isScrapingInProgress": false
  }
}
```

### POST `/api/refresh`
Manually trigger event scraping.

**Response:**
```json
{
  "success": true,
  "message": "Scraping started"
}
```

## Project Structure

```
qatar-events-aggregator/
├── public/              # Frontend files
│   ├── index.html      # Main HTML file
│   ├── styles.css      # Styles with Snoonu branding & theming
│   └── app.js          # Frontend JavaScript
├── scrapers/           # Web scrapers
│   ├── iLoveQatar.js   # ILoveQatar scraper
│   ├── qatarMuseums.js # Qatar Museums scraper
│   └── visitQatar.js   # Visit Qatar scraper
├── utils/              # Utility modules
│   ├── eventAggregator.js  # Event aggregation logic
│   └── categoryClassifier.js # AI category classification
├── server.js           # Express server
└── package.json        # Dependencies
```

## Features in Detail

### Event Scraping
The application scrapes events from three major Qatar event websites:
- **ILoveQatar** - Local events and activities (with fixed image extraction)
- **Qatar Museums** - Cultural events, exhibitions, and workshops (replaced Platinumlist)
- **Visit Qatar** - Official tourism events

### AI Category Classification
Events are automatically classified into clean, standardized categories using:
- **Gemini AI** (if API key provided) - Intelligent context-based classification
- **Rule-based fallback** - Keyword matching for reliable classification

Standard categories include: Arts & Culture, Music & Concerts, Sports & Fitness, Food & Dining, Family & Kids, and more.

### Automatic Updates
Events are automatically refreshed every 6 hours using cron jobs. You can also manually refresh by clicking the refresh button.

### Filtering Options
- **Date Range**: View events for this week, this month, or all upcoming events
- **Category**: Filter by event categories like Cultural, Food & Drink, Sports, etc.

### UI & UX Enhancements
- **Quick Actions**: One-click filters for "Today", "This Week", and "This Month".
- **Collapsible Sidebar**: ChatGPT-style sidebar for category filtering to reduce clutter.
- **Light/Dark Mode**: Toggle between themes with persistent preference saving.
- **Snoonu Branding**: Complete visual overhaul to match Snoonu B2B guidelines.

### Event Details
Click on any event card to view:
- Full description
- Date and time
- Venue location
- Pricing information
- Link to original event page

## Design Philosophy

The application features a **modern, premium design** with:
- **Snoonu Brand Identity** (Red/White/Black)
- **Light & Dark Themes** for accessibility and preference
- **Glassmorphism effects** for depth and elegance
- **Smooth animations** for enhanced UX
- **Responsive layout** that adapts to any screen size

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Event data sourced from ILoveQatar, Platinumlist, and Visit Qatar
- Icons and emojis for visual enhancement
- Google Fonts (Inter) for typography

---

**Made with ❤️ for the Qatar community**
