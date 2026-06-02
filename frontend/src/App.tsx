import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Side = 'BUY' | 'SELL';
type SymbolCode = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT';

type Order = {
  followerId: string;
  leaderTradeId: string;
  symbol: SymbolCode;
  side: Side;
  quantity: number;
  estimatedFillPrice: number;
  notional: number;
  marginRequired: number;
  status: 'ACCEPTED' | 'REJECTED';
  rejectionReason?: string;
};

type Follower = {
  id: string;
  name: string;
  equity: number;
  availableBalance: number;
  copyRatio: number;
  maxLeverage: number;
  maxNotionalPerTrade: number;
  allowedSymbols: SymbolCode[];
};

type Trade = {
  id: string;
  symbol: SymbolCode;
  side: Side;
  quantity: number;
  price: number;
  leverage: number;
  timestamp: string;
};

const API_URL = 'http://localhost:4000/api';

function App() {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [trade, setTrade] = useState<Trade | null>(null);
  const [form, setForm] = useState({ symbol: 'BTCUSDT' as SymbolCode, side: 'BUY' as Side, quantity: 0.5, price: 68000, leverage: 5, slippageBps: 15 });
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${API_URL}/followers`).then((res) => res.json()).then(setFollowers);
  }, []);

  function validateForm() {
    const errors: Record<string, string> = {};
    if (form.quantity <= 0) errors.quantity = 'Quantity must be positive';
    if (form.price <= 0) errors.price = 'Price must be positive';
    if (form.leverage <= 0) errors.leverage = 'Leverage must be positive';
    if (form.leverage > 125) errors.leverage = 'Leverage cannot exceed 125x';
    if (form.slippageBps < 0) errors.slippageBps = 'Slippage cannot be negative';
    if (form.slippageBps > 500) errors.slippageBps = 'Slippage cannot exceed 500 bps';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function simulateTrade(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    
    if (!validateForm()) return;

    const response = await fetch(`${API_URL}/simulate-copy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    
    const payload = await response.json();
    if (!response.ok) {
      setError('Invalid input. Please check all fields.');
      return;
    }
    
    setTrade(payload.trade);
    setOrders(payload.orders);
  }

  const followerMap = new Map(followers.map(f => [f.id, f]));
  const acceptedOrders = orders.filter(o => o.status === 'ACCEPTED');
  const rejectedOrders = orders.filter(o => o.status === 'REJECTED');
  const totalNotional = acceptedOrders.reduce((sum, o) => sum + o.notional, 0);
  const totalMargin = acceptedOrders.reduce((sum, o) => sum + o.marginRequired, 0);

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Demo</p>
        <h1>Copy Trading Simulator</h1>
        <p className="subtitle prose prose-2xl">Run a leader order and review copied follower orders with risk checks.</p>
      </section>

      <section className="grid">
        <form className="card" onSubmit={simulateTrade}>
          <h2>Leader trade</h2>
          
          <label>
            Symbol
            <select value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value as SymbolCode })}>
              <option>BTCUSDT</option>
              <option>ETHUSDT</option>
              <option>SOLUSDT</option>
            </select>
          </label>
          
          <label>
            Side
            <select value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value as Side })}>
              <option>BUY</option>
              <option>SELL</option>
            </select>
          </label>
          
          <label>
            Quantity
            <input 
              type="number" 
              step="0.001" 
              value={form.quantity} 
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} 
              className={validationErrors.quantity ? 'error' : ''}
            />
            {validationErrors.quantity && <span className="error-text">{validationErrors.quantity}</span>}
          </label>
          
          <label>
            Price
            <input 
              type="number" 
              step="0.01" 
              value={form.price} 
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} 
              className={validationErrors.price ? 'error' : ''}
            />
            {validationErrors.price && <span className="error-text">{validationErrors.price}</span>}
          </label>
          
          <label>
            Leverage
            <input 
              type="number" 
              value={form.leverage} 
              onChange={(e) => setForm({ ...form, leverage: Number(e.target.value) })} 
              className={validationErrors.leverage ? 'error' : ''}
            />
            {validationErrors.leverage && <span className="error-text">{validationErrors.leverage}</span>}
          </label>

          <label>
            Slippage (bps)
            <input 
              type="number" 
              step="1" 
              value={form.slippageBps} 
              onChange={(e) => setForm({ ...form, slippageBps: Number(e.target.value) })} 
              className={validationErrors.slippageBps ? 'error' : ''}
            />
            {validationErrors.slippageBps && <span className="error-text">{validationErrors.slippageBps}</span>}
            <small>Basis points. BUY slippage increases price; SELL decreases price.</small>
          </label>
          
          <button>Run simulation</button>
          {error && <p className="error">{error}</p>}
        </form>

        <section className="card">
          <h2>Followers</h2>
          <div className="followers">
            {followers.map((follower) => (
              <article key={follower.id} className="follower">
                <strong>{follower.name}</strong>
                <span>Balance ${follower.availableBalance.toLocaleString()} · Copy ratio {follower.copyRatio}x</span>
                <span>Max leverage {follower.maxLeverage}x · Max trade ${follower.maxNotionalPerTrade.toLocaleString()}</span>
              </article>
            ))}
          </div>
        </section>
      </section>

      {trade && (
        <section className="card summary-card">
          <h2>Simulation Summary</h2>
          <div className="summary-stats">
            <div className="stat">
              <div className="stat-value">{trade.symbol}</div>
              <div className="stat-label">{trade.side}</div>
            </div>
            <div className="stat">
              <div className="stat-value">{trade.quantity}</div>
              <div className="stat-label">Leader Qty</div>
            </div>
            <div className="stat">
              <div className="stat-value">${trade.price.toLocaleString()}</div>
              <div className="stat-label">Price</div>
            </div>
            <div className="stat">
              <div className="stat-value">{trade.leverage}x</div>
              <div className="stat-label">Leverage</div>
            </div>
            <div className="stat accepted">
              <div className="stat-value">{acceptedOrders.length}</div>
              <div className="stat-label">Accepted</div>
            </div>
            <div className="stat rejected">
              <div className="stat-value">{rejectedOrders.length}</div>
              <div className="stat-label">Rejected</div>
            </div>
            <div className="stat">
              <div className="stat-value">${totalNotional.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
              <div className="stat-label">Total Notional</div>
            </div>
            <div className="stat">
              <div className="stat-value">${totalMargin.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
              <div className="stat-label">Total Margin</div>
            </div>
          </div>
        </section>
      )}

      <section className="card table-card">
        <h2>Copied orders</h2>
        <table>
          <thead>
            <tr>
              <th>Follower</th>
              <th>Symbol</th>
              <th>Side</th>
              <th>Quantity</th>
              <th>Fill Price</th>
              <th>Notional</th>
              <th>Margin</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty">No results yet. Run a simulation.</td>
              </tr>
            ) : (
              orders.map((order) => {
                const follower = followerMap.get(order.followerId);
                return (
                  <tr key={`${order.followerId}-${order.leaderTradeId}`} className={order.status === 'ACCEPTED' ? 'accepted-row' : 'rejected-row'}>
                    <td className="follower-name">{follower?.name || order.followerId}</td>
                    <td>{order.symbol}</td>
                    <td><strong>{order.side}</strong></td>
                    <td>{order.quantity.toFixed(8)}</td>
                    <td>${order.estimatedFillPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                    <td>${order.notional.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                    <td>${order.marginRequired.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                    <td>
                      <span className={order.status === 'ACCEPTED' ? 'badge accepted' : 'badge rejected'}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {order.rejectionReason && <span className="rejection-reason">{order.rejectionReason}</span>}
                      {order.status === 'ACCEPTED' && <span className="success-badge">✓</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
