# AI Category Classification & Qatar Museums Integration

## What's New

### 1. AI-Powered Category Classification ✨

**Problem**: Event categories from scraped websites were often "ugly" or inconsistent:
- `"food-dining"` → Should be `"Food & Dining"`
- `"arts-culture"` → Should be `"Arts & Culture"`  
- `"workshop"` → Should be `"Education & Workshops"`

**Solution**: Integrated **Gemini AI** to automatically classify events into clean, standardized categories!

#### How It Works

The AI classifier uses two approaches:

**1. Gemini AI Classification** (if API key is provided):
```javascript
// AI analyzes event context
const prompt = `Classify this event into ONE category:
Title: ${event.title}
Description: ${event.description}
Venue: ${event.venue}

Categories: Arts & Culture, Music & Concerts, Sports & Fitness, Food & Dining, ...`;

// Returns clean category like "Arts & Culture"
```

**2. Rule-Based Fallback** (if no API key):
```javascript
// Uses keyword matching
if (text.match(/concert|music|jazz/i)) return 'Music & Concerts';
if (text.match(/art|exhibition|museum/i)) return 'Arts & Culture';
// ... more rules
```

#### Standard Categories

All events are now classified into these clean categories:
- Arts & Culture
- Music & Concerts
- Sports & Fitness
- Food & Dining
- Family & Kids
- Entertainment
- Education & Workshops
- Business & Networking
- Community & Social
- Tourism & Travel
- Exhibitions
- Festivals
- Other

---

### 2. Qatar Museums Scraper 🏛️

**Replaced**: Platinumlist scraper  
**New**: Qatar Museums scraper (qm.org.qa)

Based on the Python project's implementation, scrapes cultural events from Qatar Museums.

#### Features
- ✅ Exact selectors from Python project
- ✅ Pagination support
- ✅ Scrapes exhibitions, workshops, tours, and cultural events
- ✅ High-quality cultural content

#### What It Scrapes
```javascript
// Uses EXACT selectors
const eventCards = $('a.card--landscape');
const title = $card.find('p.card__title');
const category = $card.find('p.card__pre-title');
const date = $card.find('div.richtext--simple p');
const location = $card.find('span.museum-tag__span');
const image = $card.find('img.picture__image');
```

---

## Setup

### Option 1: With AI Classification (Recommended)

1. **Get a Gemini API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create an API key
   - Copy the key

2. **Set Environment Variable**:
   ```bash
   export GEMINI_API_KEY="your-api-key-here"
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start Server**:
   ```bash
   npm start
   ```

You'll see:
```
AI Category Classifier: Gemini AI initialized
Applying AI category classification...
```

### Option 2: Without AI (Rule-Based Only)

Just skip the API key step. The classifier will automatically use rule-based classification:

```bash
npm install
npm start
```

You'll see:
```
AI Category Classifier: No GEMINI_API_KEY found, using rule-based classification
```

---

## How Categories Are Improved

### Before AI Classification:
```javascript
{
  title: "Jazz Concert",
  category: "entertainment"  // Ugly, lowercase
}
```

### After AI Classification:
```javascript
{
  title: "Jazz Concert",
  category: "Music & Concerts",  // Clean, standardized
  originalCategory: "entertainment"  // Preserved for reference
}
```

---

## Event Sources

The aggregator now scrapes from:

1. **ILoveQatar** (iloveqatar.net)
   - Two-step scraping with exact selectors
   - Wide variety of events
   - Categories: Cultural, Food & Drink, Entertainment, etc.

2. **Qatar Museums** (qm.org.qa)
   - Cultural events, exhibitions, workshops
   - High-quality museum content
   - Categories: Exhibition, Workshop, Tour, etc.

3. **Visit Qatar** (visitqatar.com)
   - JSON extraction from HTML attributes
   - Tourism and cultural events
   - Categories: Adventure, Cultural, Dining, etc.

---

## Files Modified

### New Files:
- [`scrapers/qatarMuseums.js`](file:///Users/aymenfilali/.gemini/antigravity/scratch/qatar-events-aggregator/scrapers/qatarMuseums.js) - Qatar Museums scraper
- [`utils/categoryClassifier.js`](file:///Users/aymenfilali/.gemini/antigravity/scratch/qatar-events-aggregator/utils/categoryClassifier.js) - AI category classifier

### Updated Files:
- [`server.js`](file:///Users/aymenfilali/.gemini/antigravity/scratch/qatar-events-aggregator/server.js) - Integrated AI classifier and Qatar Museums
- [`package.json`](file:///Users/aymenfilali/.gemini/antigravity/scratch/qatar-events-aggregator/package.json) - Added @google/generative-ai dependency

### Removed Files:
- `scrapers/platinumlist.js` - Replaced with Qatar Museums

---

## Testing

### 1. Install New Dependencies
```bash
npm install
```

### 2. (Optional) Set API Key
```bash
export GEMINI_API_KEY="your-key-here"
```

### 3. Restart Server
```bash
# Stop current server (Ctrl+C)
npm start
```

### 4. Check Logs
You should see:
```
AI Category Classifier: Gemini AI initialized
Scraping ILoveQatar...
Scraping Qatar Museums...
Scraping Visit Qatar...
Applying AI category classification...
Scraping completed successfully
```

### 5. View Events
Open `http://localhost:3000` and check:
- ✅ Clean, standardized category names
- ✅ Events from Qatar Museums
- ✅ Better categorization overall

---

## Benefits

### AI Classification:
- ✅ **Consistent categories** across all sources
- ✅ **Better UX** - users see clean category names
- ✅ **Smarter filtering** - AI understands context
- ✅ **Automatic fallback** - works without API key

### Qatar Museums:
- ✅ **High-quality content** - curated cultural events
- ✅ **Reliable source** - official museum website
- ✅ **Rich categories** - exhibitions, workshops, tours
- ✅ **Better than Platinumlist** - more stable scraping

---

## Cost Considerations

**Gemini AI API**:
- Free tier: 60 requests per minute
- Our usage: ~10-30 requests per scrape (one per event)
- Scraping frequency: Every 6 hours
- **Cost**: Essentially free for this use case!

**Alternative**: Use rule-based classification (no cost, still works well)

---

## Next Steps

1. **Get API key** for best results
2. **Restart server** to apply changes
3. **Test categories** - should be much cleaner!
4. **Monitor logs** - check AI classification is working

The categories should now be beautiful and consistent! 🎨
