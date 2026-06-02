import { describe, expect, it } from 'vitest';
import { applySlippage, buildCopiedOrder, roundDownToStep } from './copyEngine.js';
import { FollowerAccount, LeaderTrade } from './types.js';

const follower: FollowerAccount = {
  id: 'f_test',
  name: 'Test Follower',
  equity: 10000,
  availableBalance: 5000,
  copyRatio: 0.5,
  maxLeverage: 5,
  maxNotionalPerTrade: 10000,
  allowedSymbols: ['BTCUSDT', 'ETHUSDT']
};

const trade: LeaderTrade = {
  id: 'lt_test',
  symbol: 'BTCUSDT',
  side: 'BUY',
  quantity: 0.1234,
  price: 68000,
  leverage: 5,
  timestamp: new Date().toISOString()
};

describe('copy trading engine', () => {
  it('applies worse price slippage for BUY and SELL', () => {
    expect(applySlippage(100, 'BUY', 50)).toBe(100.5);
    expect(applySlippage(100, 'SELL', 50)).toBe(99.5);
  });

  it('rounds quantities down to exchange step size', () => {
    expect(roundDownToStep(0.1239, 0.001)).toBe(0.123);
    expect(roundDownToStep(5.678, 0.1)).toBe(5.6000000000000005);
  });

  it('creates an accepted copied order with proportional quantity and margin', () => {
    const order = buildCopiedOrder(trade, follower, 10);
    expect(order.status).toBe('ACCEPTED');
    expect(order.quantity).toBe(0.061);
    expect(order.estimatedFillPrice).toBe(68068);
    expect(order.marginRequired).toBeCloseTo(830.43, 2);
  });

  it('rejects trades where the symbol is not allowed', () => {
    const order = buildCopiedOrder({ ...trade, symbol: 'SOLUSDT' }, follower);
    expect(order.status).toBe('REJECTED');
    expect(order.rejectionReason).toContain('Symbol');
  });

  it('rejects trades above follower leverage limits', () => {
    const order = buildCopiedOrder({ ...trade, leverage: 20 }, follower);
    expect(order.status).toBe('REJECTED');
    expect(order.rejectionReason).toContain('leverage');
  });

  it('rejects trades requiring more margin than available balance', () => {
    const lowBalanceFollower = { ...follower, availableBalance: 10 };
    const order = buildCopiedOrder(trade, lowBalanceFollower);
    expect(order.status).toBe('REJECTED');
    expect(order.rejectionReason).toContain('margin');
  });

  it('rejects trades where notional exceeds follower max notional per trade', () => {
    const restrictiveFollower = { ...follower, maxNotionalPerTrade: 1000 };
    const order = buildCopiedOrder(trade, restrictiveFollower);
    expect(order.status).toBe('REJECTED');
    expect(order.rejectionReason).toContain('notional');
  });

  it('rejects when quantity rounds down to zero', () => {
    const verySmallTrade: LeaderTrade = {
      id: 'lt_small',
      symbol: 'BTCUSDT',
      side: 'BUY',
      quantity: 0.00001,
      price: 68000,
      leverage: 2,
      timestamp: new Date().toISOString()
    };
    const smallRatioFollower = { ...follower, copyRatio: 0.0001 };
    const order = buildCopiedOrder(verySmallTrade, smallRatioFollower);
    expect(order.status).toBe('REJECTED');
    expect(order.rejectionReason).toContain('step');
  });

  it('uses follower maxLeverage for margin calculation, not leader leverage', () => {
    const followerWithLowMaxLeverage = { ...follower, maxLeverage: 2 };
    const tradeWithHighLeverage: LeaderTrade = {
      id: 'lt_high_lev',
      symbol: 'BTCUSDT',
      side: 'BUY',
      quantity: 0.1,
      price: 68000,
      leverage: 10,
      timestamp: new Date().toISOString()
    };
    const order = buildCopiedOrder(tradeWithHighLeverage, followerWithLowMaxLeverage);
    // quantity = 0.1 * 0.5 (copyRatio) = 0.05
    // price with BUY slippage 15bps = 68000 * 1.0015 = 68102
    // notional = 0.05 * 68102 = 3405.1
    // margin with follower maxLeverage 2 = 3405.1 / 2 = 1702.55
    expect(order.marginRequired).toBeCloseTo(1702.55, 1);
  });

  it('handles SELL orders with downward slippage correctly', () => {
    const sellTrade: LeaderTrade = {
      id: 'lt_sell',
      symbol: 'BTCUSDT',
      side: 'SELL',
      quantity: 0.1,
      price: 68000,
      leverage: 2,
      timestamp: new Date().toISOString()
    };
    const order = buildCopiedOrder(sellTrade, follower, 10);
    // SELL slippage reduces price: 68000 * (1 - 10/10000) = 68000 * 0.999 = 67932
    expect(order.estimatedFillPrice).toBe(67932);
    expect(order.status).toBe('ACCEPTED');
  });
});
