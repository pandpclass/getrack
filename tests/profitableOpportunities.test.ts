import assert from 'assert';
import { filterProfitableOpportunities, MAX_MARGIN_PERCENT } from '../src/lib/calculations.js';
import type { FlipOpportunity } from '../src/types/api.js';

async function run() {
  const base: FlipOpportunity = {
    id: 1,
    name: 'Test',
    currentHigh: 100,
    currentLow: 90,
    avgPrice: 95,
    margin: 10,
    marginPercent: 10,
    roi: 10,
    quantity: 1,
    totalCost: 90,
    totalProfit: 10,
    profitAfterTax: 2000,
    buyLimit: 100,
    volume: 2000,
    volatility: 5,
    lastUpdated: new Date(),
  };

  const valid = { ...base, id: 2, marginPercent: MAX_MARGIN_PERCENT };
  const invalid = { ...base, id: 3, marginPercent: MAX_MARGIN_PERCENT + 1 };

  const result = filterProfitableOpportunities([valid, invalid]);
  assert.strictEqual(result.length, 1, 'High margin items should be filtered');
  assert.strictEqual(result[0].id, 2);
  console.log('profitable opportunities filter test passed');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
