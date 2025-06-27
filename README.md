# OSRS Grand Exchange Tracker

A comprehensive full-stack application for Old School RuneScape players to identify profitable item flips based on real-time market data from the RuneScape Wiki API. Now enhanced with volume data integration, volatility filtering, and advanced portfolio optimization.

## 🎯 Overview

The OSRS Grand Exchange Tracker helps players make data-driven trading decisions by analyzing real-time market conditions, calculating GE tax-adjusted profits (with 5M cap), and providing optimized portfolio recommendations based on your trading budget. The application now includes advanced filtering for liquidity and price stability to ensure reliable trading opportunities.

## ✨ Features

### Core Functionality
- **Real-time Price Data**: Fetches live market data from RuneScape Wiki API every 5 minutes
- **Volume Integration**: 24-hour trading volume data for liquidity analysis
- **GE Tax Calculations**: All profit calculations include the 2% Grand Exchange tax with 5M cap
- **Budget Optimization**: Get personalized item recommendations based on your available GP
- **Volatility Analysis**: Risk assessment using historical price data with spike detection
- **Portfolio Management**: Optimal quantity calculations considering buy limits and budget constraints
- **Unlimited Buy Limits**: Proper handling of items with no buy limit (displayed as ∞)

### Advanced Filtering & Analysis
- **Volume Filtering**: Automatically excludes illiquid items (< 1,200 trades/24h)
- **Volatility Filtering**: Removes extremely volatile items (> 30% volatility)
- **Price Spike Detection**: Identifies and filters out items experiencing price anomalies
- **Composite Scoring**: Ranks opportunities by profit (50%), volume (30%), and ROI (20%)
- **Stability Checks**: Ensures recommended items have stable price patterns

### Enhanced User Experience
- **Item Detail Modals**: Click any item for detailed price history and analysis
- **Interactive Charts**: Simple SVG-based price trend visualization
- **Risk Indicators**: Color-coded volatility levels with explanatory tooltips
- **Budget Slider**: Adjust trading budget quickly with a range slider
- **Advanced Filters**: Set minimum volume and max volatility for recommendations
- **GE Slot Management**: Portfolio limited to 8 items (Grand Exchange slot limit)
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Technical Features
- **Automated Data Sync**: Background jobs keep market data current
- **RESTful API**: Clean endpoints for all trading data and suggestions
- **Real-time Updates**: Live data refresh without page reloads
- **Error Handling**: Robust error management with user-friendly messages
- **Performance Optimization**: Efficient database queries and caching strategies

## 🛠️ Tech Stack

### Backend
- **Node.js** with **TypeScript** for type safety
- **Fastify** web framework for high performance
- **Prisma ORM** with **SQLite** database
- **Node-cron** for scheduled data synchronization
- **Axios** for API requests

### Frontend
- **React 18** with **TypeScript**
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Custom hooks** for API integration
- **Date-fns** for date formatting

### Database Schema
- **Items**: Store item metadata (name, buy limits, icons)
- **Prices**: Historical price data with timestamps
- **Price History**: Aggregated daily statistics

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd osrs-ge-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Create and migrate database
   npm run db:push
   ```

### Setup Script (Optional)

For a one-command setup, run the provided script:

```bash
./setup.sh
```

This installs dependencies and runs `npm run db:generate` and `npm run db:push`
for you.

4. **Configure environment variables**
   Create a `.env` file and set any custom settings.
   The frontend reads `VITE_API_BASE_URL` for the API URL and defaults
   to `http://localhost:3001` when not provided.
   ```bash
   echo "VITE_API_BASE_URL=http://localhost:3001" > .env
   # Edit .env if your API runs on a different host
   ```
   The `VITE_API_BASE_URL` variable controls where the frontend sends API
   requests. Set it to your backend URL (e.g. `http://localhost:3001`) or leave
   it empty to use relative paths during local development.

5. **Start the application**
   ```bash
   # Development mode (runs both client and server)
   npm run dev
   
   # Or run separately:
   npm run dev:client  # Frontend only
   npm run dev:server  # Backend only
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: `VITE_API_BASE_URL` (default http://localhost:3001)
   - Database Studio: `npm run db:studio`

### Troubleshooting

If you see a **"Failed to Load Data"** message in the UI, ensure that:

1. The backend server is running (`npm run dev:server`).
2. `VITE_API_BASE_URL` is set in your `.env` file **or** the new proxy configuration is enabled so the frontend can reach the API.

## 📖 How to Use

### Basic Usage

1. **Set Your Budget**
   - Drag the budget slider to choose your trading capital
   - Use preset buttons (100K, 1M, 10M, 100M) for quick selection
   - Budget accepts values up to 2.1B GP (max int32)

2. **Adjust Filters (Optional)**
   - Set a minimum volume requirement with the slider
   - Limit opportunities above a chosen volatility percentage

3. **View Portfolio Recommendations**
   - The system automatically calculates optimal item selections (max 8 items)
   - See total investment, expected profits, and ROI
   - Review budget utilization and unused funds
   - Items are filtered for liquidity and stability

4. **Analyze Opportunities**
   - Browse the opportunities table for detailed item analysis
   - Sort by composite score (profit + volume + ROI)
   - View buy/sell prices, quantities, and volatility ratings
   - Click any item row for detailed price history and charts

5. **Detailed Item Analysis**
   - Click on any item to open the detail modal
   - View historical price charts and trends
   - Analyze recent trading data and volatility
   - Select different time periods (1d, 3d, 7d, 14d, 30d)

6. **Refresh Data**
   - Click "Refresh Data" to manually sync latest prices and volumes
   - Data automatically updates every 5 minutes in the background

### Understanding the Data

#### Portfolio Summary
- **Total Cost**: Your total investment across all recommended items
- **Gross Profit**: Total profit before GE tax
- **Net Profit**: Profit after 2% GE tax deduction (5M cap per item)
- **Total ROI**: Return on investment percentage
- **GE Slots Used**: Number of items selected (max 8)
- **Budget Utilization**: Percentage of budget allocated

#### Opportunity Table Columns
- **Item**: Item name, icon, and buy limit (∞ = unlimited)
- **Prices**: Current buy (low) and sell (high) prices
- **Quantity**: Recommended purchase quantity
- **24h Volume**: Recent trading volume for liquidity assessment
- **Investment**: Total GP required for this item
- **Net Profit**: Expected profit after GE tax (with 5M cap)
- **ROI**: Return on investment percentage (color-coded)
- **Risk**: Volatility rating with tooltip explanations
- **Details**: Click to view detailed analysis

#### Risk Assessment & Filtering
- **Green (Low Risk)**: < 5% price volatility
- **Yellow (Medium Risk)**: 5-15% price volatility  
- **Orange (High Risk)**: 15-25% price volatility
- **Red (Extreme Risk)**: > 25% price volatility (filtered out)

#### Volume & Liquidity Filtering
- **Minimum Volume**: 1,200 trades per 24 hours
- **Expensive Items**: Lower volume tolerance for high-value items
- **Liquidity Assessment**: Ensures recommended items can be traded reliably

#### Advanced Features
- **Price Spike Detection**: Filters out items with recent price anomalies
- **Composite Scoring**: Balances profitability, liquidity, and ROI
- **Unlimited Buy Limits**: Properly handles items with no GE restrictions
- **GE Tax Cap**: Accurate tax calculations with 5M maximum per transaction

## 🔧 API Endpoints

### Portfolio Suggestions
```http
GET /api/portfolio?budget=10000000&minVolume=0&maxVolatility=50
```
Returns optimized item recommendations with advanced filtering. Use `minVolume` (trades/24h) and `maxVolatility` (%) to tune results.

### Flip Opportunities
```http
GET /api/opportunities?budget=100000000&limit=50&minVolume=0&maxVolatility=50
```
Returns all profitable flip opportunities. `minVolume` and `maxVolatility` provide additional control over liquidity and risk.

### Item History
```http
GET /api/history/4151?days=7
```
Returns historical price data for detailed item analysis.

### Manual Data Sync
```http
POST /api/sync
```
Triggers immediate synchronization of item, price, and volume data.

### Health Check
```http
GET /api/health
```
Returns API health status and feature list.

## 📊 Database Management

### Prisma Commands
```bash
# Generate client after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Open database browser
npm run db:studio

# Reset database (development only)
npx prisma db push --force-reset
```

### Data Flow
1. **Item Sync**: Fetches item metadata from Wiki API (hourly)
2. **Price Sync**: Updates current market prices (every 5 minutes)
3. **Volume Sync**: Retrieves 24h trading volumes (on-demand)
4. **Calculations**: Processes data with enhanced filtering and scoring
5. **API Responses**: Serves optimized recommendations to frontend

## 🏗️ Project Structure

```
src/
├── components/          # React UI components
│   ├── BudgetInput.tsx     # Budget input with presets
│   ├── PortfolioSummary.tsx # Enhanced portfolio overview
│   ├── OpportunityTable.tsx # Detailed opportunities with volume
│   ├── ItemDetailModal.tsx  # Item analysis modal with charts
│   ├── LoadingSpinner.tsx   # Loading states
│   └── ErrorMessage.tsx     # Error handling UI
├── hooks/              # Custom React hooks
│   └── useApi.ts          # API integration hook
├── lib/                # Shared utilities
│   ├── database.ts        # Prisma client setup
│   └── calculations.ts    # Enhanced trading calculations
├── server/             # Backend application
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   │   ├── price-service.ts  # Enhanced with volume & filtering
│   │   └── osrs-api.ts       # Extended API integration
│   ├── jobs/              # Scheduled background jobs
│   └── index.ts           # Server entry point
├── types/              # TypeScript type definitions
│   └── api.ts             # Enhanced API response types
├── App.tsx             # Main React application
└── main.tsx            # React entry point

prisma/
└── schema.prisma       # Database schema definition
```

## 🔄 Background Jobs

### Price Synchronization
- **Frequency**: Every 5 minutes
- **Purpose**: Updates current market prices
- **Source**: RuneScape Wiki API latest prices endpoint

### Item Synchronization  
- **Frequency**: Every hour
- **Purpose**: Updates item metadata (names, limits, icons)
- **Source**: RuneScape Wiki API mapping endpoint

### Volume Data Fetching
- **Frequency**: On-demand during opportunity analysis
- **Purpose**: Retrieves 24h trading volumes for liquidity filtering
- **Source**: RuneScape Wiki API 24h volume endpoint

### Initial Data Load
- Automatically runs on first startup if database is empty
- Populates items, prices, and initial volume data

## 🎨 Design Philosophy

### User Experience
- **Clean Interface**: Minimal, focused design without clutter
- **Responsive Layout**: Optimized for all screen sizes
- **Real-time Feedback**: Loading states and progress indicators
- **Error Recovery**: Graceful error handling with retry options
- **Interactive Elements**: Clickable items for detailed analysis

### Data Presentation
- **Color Coding**: Green for profits, red for losses, yellow for warnings
- **Progressive Disclosure**: Show essential info first, details on demand
- **Contextual Information**: Tooltips and help text where needed
- **Performance Metrics**: Clear ROI and risk indicators
- **Visual Charts**: Simple SVG-based price trend visualization

## 🚨 Important Notes

### API Usage
- Respects RuneScape Wiki API rate limits
- Includes proper User-Agent headers
- Implements request timeouts and error handling
- Fetches volume data for enhanced analysis

### Enhanced GE Tax Calculation
- All profit calculations include the 2% Grand Exchange tax
- Tax is calculated per item: `max(1, min(floor(sellPrice * 0.02), 5000000))`
- 5M GP tax cap implemented for high-value items
- Net profit = Gross profit - (Tax per item × Quantity)

### Advanced Filtering
- **Volume Filter**: Minimum 1,200 trades per 24 hours
- **Volatility Filter**: Excludes items with >30% price volatility
- **Stability Filter**: Removes items with detected price spikes/crashes
- **Buy Limit Handling**: Treats 0 as unlimited (∞)
- **Margin Filter**: Ignores items with margins above 1000% to avoid unrealistic ROI

### Portfolio Optimization
- Maximum 8 items (Grand Exchange slot limit)
- Composite scoring: Profit (50%) + Volume (30%) + ROI (20%)
- Removed artificial 10% budget cap per item
- Dynamic quantity calculation based on volume and buy limits

### Data Accuracy
- Prices update every 5 minutes from official API
- Volume data fetched on-demand for real-time liquidity assessment
- Historical data used for volatility and spike detection
- No guarantee of actual in-game availability

## 🆕 Latest Changes (v2.1)

### Major Enhancements
1. **Volume Data Integration**: 24h trading volume filtering and display
2. **Buy Limit Handling**: Proper support for unlimited buy limits (∞)
3. **Volatility Filtering**: Advanced price stability checks and spike detection
4. **Composite Scoring**: Improved opportunity ranking algorithm
5. **Portfolio Optimization**: GE slot limit (8 items) and better budget allocation
6. **GE Tax Cap**: 5M GP maximum tax per transaction
7. **Item Detail Modals**: Interactive price history and analysis
8. **Enhanced UI**: Better risk indicators, tooltips, and mobile responsiveness
9. **Unrealistic Margin Filter**: Skips items with extreme price gaps

### v2.1 Highlights
1. **Beta Mode Toggle**: Quickly include high-risk, long-term investments
2. **Historical Preload**: Startup routine fetches 24h of price history
3. **Improved Volatility Analysis**: Uses preloaded data for stability checks

### Technical Improvements
- Enhanced calculation algorithms with multiple filtering layers
- Improved API endpoints with historical data support
- Better error handling and graceful degradation
- Optimized database queries and caching strategies
- Comprehensive TypeScript type definitions
- Frontend API URL configured via `VITE_API_BASE_URL`

## 💡 Next Steps

- Add authentication so users can save personal watchlists
- Provide charts comparing opportunity history over time
- Expose API parameters for custom volume/volatility thresholds
- Implement push notifications for high-profit flips

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **RuneScape Wiki** for providing the comprehensive market data API
- **Jagex** for creating Old School RuneScape
- **OSRS Community** for their trading insights and feedback

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page for existing problems
2. Create a new issue with detailed information
3. Include error messages, browser console logs, and steps to reproduce

---

**Disclaimer**: This tool is for educational and informational purposes only. Market conditions in Old School RuneScape can change rapidly, and past performance does not guarantee future results. Always verify prices in-game before making trades. The application filters out low-volume and volatile items to provide more reliable recommendations, but market conditions can still change unexpectedly.