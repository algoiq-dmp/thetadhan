// Help content for all 41 Light Z screens + Settings + FAQ
export const SCREEN_HELP = {
  mw: {
    title: 'Market Watch', shortcut: 'F4',
    desc: 'Primary monitoring workspace displaying real-time prices, volumes, and key metrics for all added securities. Supports 30 data columns, multiple portfolios, drag-and-drop reordering, and CSV import/export.',
    features: [
      '30 data columns (Symbol, LTP, Chg, Vol, OI, Greeks, etc.)',
      '12 built-in portfolios + unlimited custom portfolios',
      'Column profiles: Equity View, FnO View, Scalping View, Full View',
      'Real-time LTP flash with ▲/▼ tick arrows',
      'Right-click context menu (14 actions)',
      'Drag-and-drop row reordering',
      'Column resize, reorder, and freeze (sticky Symbol)',
      'CSV export/import for portfolio backup',
      'Exchange (NSE/BSE/MCX) and instrument filters',
      'Sort by any column (click header)',
      'Separators via Shift+Enter',
      'Circuit limit highlighting (yellow border)',
    ],
    tips: [
      'Press Insert or click +Add to open the 6-step Add Scrip workflow',
      'Right-click column headers to toggle column visibility',
      'Double-click column border to auto-fit width',
      'Use Cols button to access named column profiles',
    ],
    related: ['buy', 'sell', 'depth', 'oc', 'chart']
  },
  buy: {
    title: 'Buy Order', shortcut: 'F1',
    desc: 'Place buy orders with full control over exchange, instrument, product type, order type, quantity, and price. Includes live Best-5 market depth for informed decisions.',
    features: [
      'Exchange: NSE, BSE, MCX',
      'Instruments: EQ, FUTSTK, FUTIDX, OPTSTK, OPTIDX, FUTCUR, OPTCUR, FUTCOM',
      'Product: MIS (Intraday), NRML (Carryforward), CNC (Delivery)',
      'Order Type: Market, Limit, SL, SL-M',
      'Validity: DAY, IOC, GTD',
      'Live Best-5 market depth panel',
      'Lot size calculation for F&O',
      'Confirmation dialog before submission',
    ],
    tips: [
      'Blue theme = Buy side. F1 opens from anywhere.',
      'Select a symbol in Market Watch first, then press F1',
      'Use Market order for instant execution, Limit for price control',
    ],
    related: ['sell', 'ob', 'np']
  },
  sell: {
    title: 'Sell Order', shortcut: 'F2',
    desc: 'Place sell orders with identical controls to Buy. Red-themed for quick visual identification.',
    features: ['Same as Buy Order with red theme (#C62828)', 'All order types and products supported'],
    tips: ['Red theme = Sell side. F2 opens from anywhere.', 'Use SL (Stop-Loss) orders to protect positions'],
    related: ['buy', 'ob', 'np']
  },
  ob: {
    title: 'Order Book', shortcut: 'F3',
    desc: 'View all orders placed during the session. Filter by status, modify pending orders, cancel orders individually or in bulk.',
    features: [
      'All columns: Time, Symbol, Exchange, Side, Product, Order Type, Qty, Filled, Pending, Price, Trigger, Avg Price, Status, Order No, Remarks',
      'Filter tabs: ALL, OPEN, EXECUTED, REJECTED, CANCELLED with counts',
      'Modify order (double-click or Shift+F2)',
      'Cancel single order (Shift+F1)',
      'Cancel All Open orders (Shift+F3)',
      'Right-click menu: Modify, Cancel, History, Copy',
      'Expandable order history',
    ],
    tips: [
      'Shift+F1 cancels selected order, Shift+F3 cancels all open orders',
      'Check rejection reason in Remarks column',
      'Order history shows modification trail',
    ],
    related: ['buy', 'sell', 'tb']
  },
  mp: {
    title: 'Market Picture', shortcut: 'F5',
    desc: 'Ticker-style scrolling view of market breadth and sectoral performance.',
    features: ['Real-time ticker display', 'Sector-wise breakdowns', 'Advance/Decline ratios'],
    tips: ['Use for quick market overview at a glance'],
    related: ['mw', 'heatmap']
  },
  depth: {
    title: 'Market Depth', shortcut: 'F6',
    desc: 'Best 5 buy and sell price levels with quantities for the selected security. Essential for understanding order flow and liquidity.',
    features: ['Best 5 Buy levels (Price + Qty + Orders)', 'Best 5 Sell levels (Price + Qty + Orders)', 'Total Buy/Sell quantities', 'LTP, Volume, OHLC display'],
    tips: ['Large quantity at a level = strong support/resistance', 'Check bid-ask spread for liquidity'],
    related: ['mw', 'buy', 'sell']
  },
  oc: {
    title: 'Option Chain', shortcut: 'F7',
    desc: 'Full option chain with calls on left, puts on right, centered on strike price. Shows all 5 Greeks, OI buildup analysis, bid/ask, and IV per strike.',
    features: [
      'CE/Strike/PE butterfly layout',
      'All 5 Greeks: Delta (Δ), Gamma (Γ), Theta (Θ), Vega (ν), Rho (ρ)',
      'OI and OI Change with buildup analysis (Long Build / Short Build / Short Covering / Long Unwinding)',
      'IV per strike',
      'Bid/Ask prices',
      'Click-to-Trade: click LTP to open Buy/Sell',
      'PCR and Max Pain in footer',
      'Load to Market Watch (ATM ± 3 strikes)',
      'OI View / Greek View toggle',
      'Strike gap: 50/100/200/500',
    ],
    tips: [
      'Green = Long Building (bullish), Red = Short Building (bearish)',
      'High Put OI = support level, High Call OI = resistance level',
      'PCR > 1 = bullish sentiment, PCR < 1 = bearish',
    ],
    related: ['calc', 'buy', 'sell', 'mw']
  },
  tb: {
    title: 'Trade Book', shortcut: 'F8',
    desc: 'Record of all executed trades for the session with details on price, quantity, and timestamps.',
    features: ['Time, Symbol, Exchange, Side, Qty, Price, Order No, Trade No, Product', 'CSV export', 'Filter by instrument'],
    tips: ['Trade Book shows only executed trades, not pending orders', 'Use CSV export for tax reporting'],
    related: ['ob', 'np']
  },
  chart: {
    title: 'Chart', shortcut: 'F9',
    desc: 'Full-featured candlestick chart with 12 technical indicators, 7 drawing tools, and 8 timeframes. Custom Canvas renderer for high performance.',
    features: [
      '8 Timeframes: 1m, 5m, 15m, 30m, 1H, 4H, 1D, 1W',
      '12 Indicators: SMA, EMA, Bollinger Bands, RSI, MACD, VWAP, ADX, CCI, Stochastic, ATR, OBV, Parabolic SAR',
      '7 Drawing Tools: Trendline, Horizontal Line, Fibonacci, Rectangle, Channel, S/R, Text',
      'Volume bars panel',
      'Crosshair cursor',
      'Chart types: Candlestick, Line, Heikin-Ashi',
      'Clear all drawings button',
    ],
    tips: [
      'Toggle indicators with buttons in toolbar',
      'RSI > 70 = overbought, RSI < 30 = oversold',
      'Click & drag to draw trendlines',
    ],
    related: ['hist', 'mw']
  },
  msg: {
    title: 'Message Log', shortcut: 'F10',
    desc: 'Centralized log of all system messages including order confirmations, rejections, exchange alerts, and system notifications.',
    features: ['Color-coded by type (Success/Error/Warning/Info)', 'Filterable by category', 'Timestamped entries', 'Auto-scroll with manual lock', 'Export to file'],
    tips: ['Check Message Log immediately after order placement for confirmation or rejection details'],
    related: ['ob', 'settings']
  },
  hist: {
    title: 'Historical Data', shortcut: 'F11',
    desc: 'Tabular view of historical OHLCV data for analysis and backtesting reference.',
    features: ['Date, Open, High, Low, Close, Volume columns', 'Multiple timeframe selection', 'CSV export'],
    tips: ['Compare with chart for visual confirmation'],
    related: ['chart', 'mw']
  },
  pa: {
    title: 'Portfolio Analysis', shortcut: 'F12',
    desc: 'Holdings analysis with sector-wise allocation, P&L tracking, and portfolio performance metrics.',
    features: ['Holdings grid with current value and P&L', 'Sector allocation breakdown', 'Day gain/loss tracking', 'Overall portfolio return'],
    tips: ['Use for end-of-day review of all holdings'],
    related: ['np', 'mw']
  },
  np: {
    title: 'Net Position', shortcut: 'Alt+F6',
    desc: 'Real-time view of all open positions with MTM P&L, realized P&L, and position management actions.',
    features: [
      'All columns: Symbol, Exchange, Product, Buy/Sell Qty & Avg, Net Qty, LTP, MTM P&L, Realized, Total P&L, Buy/Sell Value',
      'Square Off single position or all positions',
      'Convert product (MIS ↔ NRML)',
      'Add more to existing position',
      'Footer totals: MTM + Realized + Total P&L',
      'Auto square-off timer setting',
    ],
    tips: [
      'Green = profit, Red = loss',
      'Square Off All closes everything — use with caution',
      'Convert MIS to NRML before 3:15 PM to carry forward',
    ],
    related: ['ob', 'tb', 'buy', 'sell']
  },
  calc: {
    title: 'Greeks Calculator', shortcut: '—',
    desc: '4-in-1 calculator: IV Calculator, Greeks display, Pivot Points, and Greek Neutraliser for position hedging.',
    features: [
      'IV Calculator: Black-Scholes implied volatility from option premium',
      'Greeks: Delta, Gamma, Theta, Vega, Rho + Intrinsic/Time value + Moneyness',
      'Pivot Calculator: Classic pivot with R1-R3 and S1-S3',
      'Greek Neutraliser: Multi-leg position delta/gamma neutral analysis with hedge recommendations',
    ],
    tips: [
      'Use IV Calculator to check if an option is cheap or expensive',
      'Greek Neutraliser shows how many futures to hedge delta',
    ],
    related: ['oc', 'fib', 'margin']
  },
  settings: {
    title: 'Settings', shortcut: '—',
    desc: 'Comprehensive settings hub with 11 tabs covering themes, trading defaults, risk management, alerts, connections, and system configuration.',
    features: ['Theme (5 presets)', 'General (startup, backup/restore)', 'Trading (defaults)', 'Market Watch (flash, gridlines)', 'Display (font, row height)', 'Columns', 'Charts', 'Risk (kill switch, max positions)', 'Connection (admin server, contract upload)', 'Alerts (4 sound types with test)', 'About'],
    tips: ['Auto-backup saves your session on exit', 'Test trade sounds in Alerts tab before trading'],
    related: ['broadcast', 'exchSet']
  },
  broadcast: {
    title: 'Broadcast Settings', shortcut: '—',
    desc: 'Configure market data feed connection — IBT (Internet), Lease Line (UDP), or API mode.',
    features: ['3 connection modes: IBT, Lease Line, API', 'Server IP/Port per segment', 'Always-ON / Auto-reconnect', 'Enhanced mode / Read interval', 'Download Masters', 'Test Connection'],
    tips: ['Use IBT for internet, Lease Line for low-latency direct connection'],
    related: ['settings', 'exchSet']
  },
  bo: {
    title: 'Bracket Order', shortcut: '—',
    desc: 'Place orders with automatic target and stop-loss legs. All 3 legs placed simultaneously.',
    features: ['Entry Price + Target + Stop-Loss in one order', 'Trailing SL option', 'Auto-square-off on target or SL hit'],
    tips: ['BO reduces risk by enforcing exit discipline', 'Only available for Intraday (MIS) product'],
    related: ['co', 'buy', 'sell']
  },
  co: {
    title: 'Cover Order', shortcut: '—',
    desc: 'Place orders with a mandatory stop-loss leg for risk protection.',
    features: ['Entry + Compulsory Stop-Loss', 'Lower margin requirement than regular orders'],
    tips: ['CO is simpler than BO — just entry + SL, no target'],
    related: ['bo', 'buy', 'sell']
  },
  spread: {
    title: 'Spread Order', shortcut: 'Ctrl+F3',
    desc: 'Place 2-leg spread orders for calendar spreads, vertical spreads, or arbitrage.',
    features: ['2-leg simultaneous entry', 'Net debit/credit calculation', 'Calendar and vertical spreads'],
    tips: ['Use for arbitrage between expiries or strikes'],
    related: ['basket', 'oc']
  },
  basket: {
    title: 'Basket Order', shortcut: '—',
    desc: 'Create and execute a group of multiple orders simultaneously.',
    features: ['Multi-order grouping', 'Add/remove legs', 'Execute all at once'],
    tips: ['Use for multi-leg strategies like Iron Condor (4 legs)'],
    related: ['spread', 'gridOrd']
  },
  gridOrd: {
    title: 'Grid Order', shortcut: '—',
    desc: 'Place multiple orders at regular price intervals for grid trading strategy.',
    features: ['Price grid with customizable interval', 'Buy/Sell at each grid level', 'Quantity per grid level'],
    tips: ['Grid trading works best in ranging markets'],
    related: ['basket', 'bo']
  },
  ptst: {
    title: 'PTST Order', shortcut: '—',
    desc: 'Pre-Trade / Settlement verification order with exchange compliance checks.',
    features: ['Pre-trade risk checks', 'Settlement verification', 'Compliance validation'],
    tips: ['Use for institutional compliance requirements'],
    related: ['ob']
  },
  excelOrd: {
    title: 'Bulk Order Upload', shortcut: '—',
    desc: 'Upload multiple orders from a CSV/Excel file for batch execution.',
    features: ['CSV file upload', 'Template download', 'Validation before execution', 'Error highlighting', 'Execute all or selected'],
    tips: ['Download template first, fill it, then upload', 'Check validation results before executing'],
    related: ['basket', 'ob']
  },
  posUp: {
    title: 'Position Upload', shortcut: '—',
    desc: 'Import existing positions from CSV for tracking and management.',
    features: ['CSV upload', 'Position reconciliation', 'Existing position tracking'],
    tips: ['Use to import BOD (Beginning of Day) positions'],
    related: ['np']
  },
  exchSet: {
    title: 'Exchange Settings', shortcut: '—',
    desc: 'Configure exchange segment connectivity and trading permissions.',
    features: ['Per-exchange settings', 'Segment enable/disable', 'Member/Terminal ID config'],
    tips: ['Enable only segments you trade for cleaner interface'],
    related: ['settings', 'broadcast']
  },
  alerts: {
    title: 'Alerts Manager', shortcut: '—',
    desc: 'Set price, volume, and OI alerts with sound and popup notifications.',
    features: ['Price/Volume/OI/%Change/52W alerts', 'Conditions: Above, Below, Equals, Range', 'Sound + Popup notification options', 'Pause/Resume individual alerts', 'Active/Triggered status'],
    tips: ['Set alerts for key support/resistance levels', 'Use OI alerts for tracking institutional activity'],
    related: ['mw', 'settings']
  },
  margin: {
    title: 'Margin Calculator', shortcut: '—',
    desc: 'Calculate margin requirement for any F&O position before placing orders.',
    features: ['Span margin + Exposure margin', 'Multi-leg margin benefit', 'Product-wise margin'],
    tips: ['Check margin before placing large orders to avoid rejections'],
    related: ['calc', 'np']
  },
  pivot: {
    title: 'Pivot Calculator', shortcut: '—',
    desc: 'Calculate classic pivot points, support, and resistance levels from previous day OHLC.',
    features: ['Classic Pivot formula', 'R1-R3 Resistance levels', 'S1-S3 Support levels'],
    tips: ['Pivot = (H+L+C)/3 — most watched intraday level'],
    related: ['calc', 'fib']
  },
  fib: {
    title: 'Fibonacci Calculator', shortcut: '—',
    desc: 'Calculate Fibonacci retracement and extension levels for swing trading.',
    features: ['Retracement: 23.6%, 38.2%, 50%, 61.8%, 78.6%', 'Extension: 127.2%, 161.8%, 261.8%'],
    tips: ['61.8% retracement is the "golden ratio" — strongest level'],
    related: ['calc', 'pivot']
  },
  heatmap: {
    title: 'Heat Map', shortcut: 'Shift+F10',
    desc: 'Visual representation of market sectors using color-coded blocks sized by weight.',
    features: ['NIFTY 50 and Bank Nifty sectors', 'Color: green (up) to red (down)', 'Block size proportional to index weight', 'Hover to zoom + see LTP', 'Advance/Decline count'],
    tips: ['Green = bullish, Red = bearish at a glance', 'Larger blocks = higher index weightage'],
    related: ['mw', 'mp']
  },
  snap: {
    title: 'Snap Quote', shortcut: 'Shift+F9',
    desc: 'Detailed single-symbol view with all price data, volumes, circuit limits, and contract info.',
    features: ['OHLC, Volume, ATP, LTQ', 'Total Buy/Sell Qty', 'Circuit limits', '52W High/Low', 'OI data', 'Contract Info (Shift+F8): Expiry, Strike, Lot Size, Freeze Qty'],
    tips: ['Use to quickly check all data points for one symbol'],
    related: ['mw', 'depth']
  },
  bhav: {
    title: 'Bhav Copy', shortcut: '—',
    desc: 'End-of-day settlement data published by exchanges.',
    features: ['Daily settlement prices', 'Open Interest data', 'Volume data', 'Downloadable/importable'],
    tips: ['Bhav Copy is published after market close (3:30 PM)'],
    related: ['hist', 'mw']
  },
  multiMW: {
    title: 'Multi Market Watch', shortcut: '—',
    desc: 'Workspace with 2/3/4 synchronized Market Watch panels for monitoring multiple segments simultaneously.',
    features: ['2-panel, 3-panel, or 4-panel grid layout', 'Each panel is independent Market Watch', 'Synced selection across panels'],
    tips: ['Use for monitoring NSE Cash + FnO + Currency simultaneously'],
    related: ['mw']
  },
  trail: {
    title: 'Trade Trail', shortcut: '—',
    desc: 'Full audit log capturing every trading event with timestamps, prices, and underlying data for compliance.',
    features: ['Timestamped event log', 'Symbol, Price, Side, Qty columns', 'Underlying price and IV at time of trade', 'OI change tracking', 'CSV export for SEBI compliance'],
    tips: ['Use for end-of-day trade review', 'Export for tax/audit records'],
    related: ['tb', 'ob']
  },
  expenses: {
    title: 'Expenses Master', shortcut: '—',
    desc: 'Detailed breakdown of all trading costs: brokerage, STT, transaction charges, GST, SEBI fees.',
    features: ['Brokerage calculation', 'STT/CTT charges', 'Exchange transaction charges', 'GST on brokerage', 'SEBI turnover fees', 'Net profit after all charges'],
    tips: ['Check total charges before calculating actual profit', 'F&O STT is lower than equity STT'],
    related: ['tb', 'np']
  },
  scanner: {
    title: 'Event Scanner', shortcut: '—',
    desc: 'Real-time market event scanner with 12 pre-defined scan conditions for spotting opportunities.',
    features: [
      '12 Scan Presets: Volume Spike, OI Buildup, Circuit Hit, Gap Up/Down, 52W High/Low, High IV, IV Crush, PCR Extreme, Block Deal, High Delivery',
      'Category filters: Price, Volume, OI, IV',
      'Live scanning with auto-refresh',
      'Pause/Resume scanning',
      'Results with LTP and % change',
    ],
    tips: ['Volume Spike > 3x avg is strong institutional signal', 'OI Buildup > 10% indicates new position creation'],
    related: ['alerts', 'ticker', 'mw']
  },
  ticker: {
    title: 'Conditional Ticker', shortcut: '—',
    desc: 'Filtered tick-by-tick tape with 8 condition filters for monitoring specific market activity in real-time.',
    features: [
      '8 Conditions: Price Up/Down, Big Move (>2%), Volume >100K, Buy/Sell Side, F&O Only, Equity Only',
      'Adjustable speed: 1s, 3s, 5s',
      'Live/Pause toggle',
      '200-tick buffer',
      'Buy/Sell count in footer',
    ],
    tips: ['Use Big Move filter to catch sudden price spikes', 'F&O Only filter is useful during expiry day'],
    related: ['scanner', 'mw', 'alerts']
  },
}

// Settings Help Guide — all 11 tabs documented
export const SETTINGS_HELP = [
  { tab: 'Theme', icon: '🎨', desc: 'Switch between 5 visual presets: ODIN Classic (dark blue), Dark (pure black), Light (white), Comfort (warm), GETS (green). Changes apply instantly to all windows.', tips: ['ODIN Classic matches institutional terminal standards', 'Comfort theme reduces eye strain for long sessions'] },
  { tab: 'General', icon: '⚙', desc: 'Startup behavior, auto-save, backup/restore settings. Auto-backup captures localStorage on exit.', tips: ['Enable auto-backup to prevent data loss', 'Restore from last 5 session backups'] },
  { tab: 'Trading', icon: '📊', desc: 'Default product type (MIS/NRML/CNC), order type (MKT/LMT), validity (DAY/IOC), and confirmation dialogs.', tips: ['Set your most-used product as default to save time'] },
  { tab: 'Market Watch', icon: '📋', desc: 'LTP flash animation, gridlines, auto-refresh interval, freeze column settings.', tips: ['Disable flash animation if it distracts you'] },
  { tab: 'Display', icon: '🖥', desc: 'Font family, font size, row height, flash duration, number formatting.', tips: ['JetBrains Mono is best for reading prices'] },
  { tab: 'Columns', icon: '⊞', desc: 'Full column manager for Market Watch. Toggle visibility, reorder columns, save column profiles.', tips: ['Use named profiles to quickly switch between Equity and FnO views'] },
  { tab: 'Charts', icon: '📈', desc: 'Default timeframe, chart type, indicator settings, color scheme.', tips: ['Set your most-used timeframe as default'] },
  { tab: 'Risk', icon: '🛡', desc: 'Max open positions, daily loss limit, kill switch, auto-square-off timer.', tips: ['Enable kill switch to stop all trading with one click', 'Set auto-square-off to 15:20 for intraday'] },
  { tab: 'Connection', icon: '🌐', desc: 'Admin server URL, reconnect settings, exchange status, contract master auto-upload.', tips: ['Contract auto-upload runs at BOD (Beginning of Day)'] },
  { tab: 'Alerts', icon: '🔔', desc: '4 sound types (Trade Confirm, Rejection, Alert, System) with volume control and test buttons.', tips: ['Test all sounds before market hours to ensure they work'] },
  { tab: 'About', icon: 'ℹ', desc: 'Version information, build date, system details, license.', tips: [] },
]

// FAQ section — 20 questions
export const FAQ = [
  { q: 'How do I add a new scrip to Market Watch?', a: 'Press Insert key or click "+Add (Ins)" button. Follow the 6-step workflow: Exchange → Instrument → Symbol → Expiry → Strike → Type. A typeahead search helps find symbols quickly.' },
  { q: 'What is the difference between MIS, NRML, and CNC?', a: 'MIS (Margin Intraday Square-off) = Intraday only, auto-squared off by 3:20 PM. NRML (Normal) = Carryforward F&O positions. CNC (Cash & Carry) = Delivery-based equity holding.' },
  { q: 'How do I place a Stop-Loss order?', a: 'In Buy/Sell window, select "SL" order type. Enter your Trigger Price (the level where order activates) and Limit Price. SL-M is market SL.' },
  { q: 'How do I save my workspace layout?', a: 'File → Save Workspace As... or press Ctrl+S. Name your workspace. Load it later from File → Load Workspace.' },
  { q: 'What do the colors in Heat Map mean?', a: 'Dark green = >2% up, Light green = 0-2% up, Pink = 0-1% down, Red = 1-2% down, Dark red = >2% down. Block size = index weight.' },
  { q: 'How do I change the theme?', a: 'Settings → Theme tab. Choose from 5 presets: ODIN Classic, Dark, Light, Comfort, GETS. Changes apply instantly.' },
  { q: 'What is PCR in Option Chain?', a: 'Put-Call Ratio = Total Put OI ÷ Total Call OI. PCR > 1 = bearish hedging (bullish), PCR < 1 = call buying (bearish). PCR = 1 = neutral.' },
  { q: 'How do I export orders to CSV?', a: 'Click the ⬇Export button in the toolbar of Order Book, Trade Book, or Market Watch. The file downloads immediately.' },
  { q: 'What is Auto-Backup?', a: 'Auto-Backup saves all your settings, portfolios, and workspace layouts to localStorage when you close the terminal. Last 5 backups are kept. Restore from Settings → General.' },
  { q: 'How do I set price alerts?', a: 'Open Alerts Manager (from Tools menu). Click "+ New Alert", select symbol, type (Price/Volume/OI), condition (Above/Below), and value. Enable Sound and Popup notifications.' },
  { q: 'What are the keyboard shortcuts?', a: 'Press Ctrl+/ to see the full shortcuts panel. Key shortcuts: F1=Buy, F2=Sell, F3=Order Book, F4=Market Watch, F7=Option Chain, Escape=Close window.' },
  { q: 'How do I modify a pending order?', a: 'Open Order Book (F3), find the order, double-click or right-click → Modify. Change price/qty/type and confirm.' },
  { q: 'What is Greek Neutraliser?', a: 'A tool in Greeks Calculator (4th tab) that analyzes your multi-leg position\'s net delta/gamma and recommends hedge trades to make the position delta-neutral or gamma-neutral.' },
  { q: 'How do I use the Event Scanner?', a: 'Open from Tools → Event Scanner. Enable scan presets (e.g., Volume Spike, OI Buildup). Results appear in real-time as conditions are triggered. Filter by category.' },
  { q: 'What is the Conditional Ticker?', a: 'A filtered real-time tick tape. Set conditions like "Big Move >2%" or "Volume >100K" to see only ticks matching your criteria. Useful for spotting opportunities.' },
  { q: 'How do I view contract details?', a: 'Select any F&O symbol in Market Watch, then open Snap Quote (Shift+F9). Contract Info section (Shift+F8) shows Expiry, Strike, Lot Size, Freeze Qty, Tick Size.' },
  { q: 'Can I have multiple Market Watch windows?', a: 'Yes! Use Multi Market Watch from View menu. Choose 2/3/4 panel layout. Each panel is an independent Market Watch with its own portfolio.' },
  { q: 'How do I use Bracket Orders?', a: 'Open from Orders → Bracket Order. Set Entry Price, Target Price, and Stop-Loss Price. All 3 legs are placed simultaneously. Available only for MIS.' },
  { q: 'What is the Trade Trail?', a: 'An audit log that captures every trading event with timestamps, underlying price, IV, and OI change. Essential for SEBI compliance and post-market review. Export to CSV.' },
  { q: 'How do I calculate margin requirements?', a: 'Open Margin Calculator from Tools menu. Select segment, symbol, and quantity. The calculator shows SPAN margin + Exposure margin = Total margin required.' },
]
