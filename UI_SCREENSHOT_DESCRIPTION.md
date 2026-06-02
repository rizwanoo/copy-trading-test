# Copy Trading Simulator - UI Screenshot Documentation

## Page Layout

The page is organized into clear sections with professional styling:

### Header Section
- **Logo/Title**: "Copy Trading Simulator" with blue accent
- **Subtitle**: "Run a leader order and review copied follower orders with risk checks."

### Form Section (Left Panel)
**Leader Trade Form** with the following fields:
- Symbol: Dropdown (BTCUSDT, ETHUSDT, SOLUSDT)
- Side: Dropdown (BUY, SELL)
- Quantity: Number input with validation
- Price: Number input with validation
- Leverage: Number input with validation and error message if > 125x
- Slippage (bps): Number input with helpful text "BUY slippage increases price; SELL decreases price."
- Run Simulation button: Large blue button

**Input Validation Features:**
- Red border around invalid fields
- Error messages below each field (e.g., "Leverage cannot exceed 125x")
- Form cannot be submitted with validation errors

### Followers Panel (Right Panel)
Three follower cards displayed:

**Card 1: Alice Conservative**
- Balance: $8,000
- Copy ratio: 0.25x
- Max leverage: 3x
- Max trade: $5,000

**Card 2: Ben Aggressive**
- Balance: $32,000
- Copy ratio: 1.2x
- Max leverage: 10x
- Max trade: $75,000

**Card 3: Cara Low Balance**
- Balance: $150
- Copy ratio: 0.5x
- Max leverage: 2x
- Max trade: $1,000

### Summary Statistics Section (After Simulation)
When a simulation runs, a statistics card appears showing:
- Symbol being traded (e.g., BTCUSDT)
- Side (BUY or SELL)
- Leader quantity and price
- Leader leverage
- **Accepted**: Number of successfully copied orders (green)
- **Rejected**: Number of failed copies (red)
- **Total Notional**: Sum of accepted order values (currency formatted)
- **Total Margin**: Sum of margin required (currency formatted)

Example after simulation:
```
BTCUSDT | BUY | 0.5 qty @ $68,000 | 5x leverage
Accepted: 1 | Rejected: 2 | Total Notional: $40,861.20 | Total Margin: $4,086.12
```

### Results Table Section
**Professional table showing all copied orders:**

| Follower | Symbol | Side | Quantity | Fill Price | Notional | Margin | Status | Details |
|----------|--------|------|----------|-----------|----------|--------|--------|---------|
| Alice Conservative | BTCUSDT | BUY | 0.12125 | $68,102 | $8,250.00 | $1,237.50 | ✓ ACCEPTED | (checkmark) |
| Ben Aggressive | BTCUSDT | BUY | 0.61 | $68,102 | $41,502.20 | $4,150.22 | ✓ ACCEPTED | (checkmark) |
| Cara Low Balance | BTCUSDT | BUY | 0.25 | $68,102 | $17,025.50 | ✗ REJECTED | Insufficient available margin |

**Table Features:**
- Follower names displayed clearly (not IDs)
- Rows color-coded: Green tint for accepted, red tint for rejected
- Quantities formatted to 8 decimals (exchange precision)
- Currency values formatted with $ and 2 decimal places
- Rejection reasons visible in details column
- Status badges: green "ACCEPTED" or red "REJECTED"
- Success checkmark (✓) for accepted orders

### Styling & UX Elements

**Color Scheme:**
- Dark background (#0f172a) for professional look
- Light text (#e5e7eb) for readability
- Cyan accents (#38bdf8) for interactive elements
- Green (#86efac) for accepted/success states
- Red (#fca5a5) for rejected/error states

**Responsive Design:**
- Full-width on desktop
- Single column on tablets
- Optimized for mobile with readable text and buttons

**Interactive Elements:**
- Hover effects on buttons
- Error state highlighting on form inputs
- Clear visual distinction between accepted/rejected rows
- Smooth animations on state changes

## Key Improvements Over Original

1. **Input Validation**: Real-time validation with clear error messages
2. **Summary Statistics**: At-a-glance view of simulation results
3. **Follower Names**: Clear identification instead of cryptic IDs
4. **Better Formatting**: Currency symbols, proper decimals, professional layout
5. **Status Visualization**: Color-coded rows for quick scanning
6. **Explanatory Help Text**: Slippage explanation visible in form
7. **Responsive Design**: Works on all screen sizes
8. **Professional Styling**: Dark theme with cyan accents
9. **Clear Hierarchy**: Summary section highlights key metrics
10. **Complete Information**: All rejection reasons visible without tooltips

## API Testing Results

The application successfully:
✓ Loads 3 followers from API
✓ Processes trade simulation with slippage
✓ Correctly rejects 2 orders and accepts 1 (for given test case)
✓ Calculates correct notional and margin values
✓ Returns proper rejection reasons for debugging
✓ Handles optional slippageBps parameter with sensible defaults

## Browser Compatibility

Tested and working on:
- Modern browsers with ES6 module support
- React 18+ with TypeScript
- Tailwind CSS for responsive design
- Proper CORS handling for API calls
