import { execSync } from 'child_process';
import assert from 'assert';
import prisma from '../src/lib/database.js';
import { PriceService } from '../src/server/services/price-service.js';
import { OSRSApiService } from '../src/server/services/osrs-api.js';

async function run() {
  process.env.DATABASE_URL = 'file:./tests/test.db';
  execSync('npx prisma db push --force-reset > /dev/null');

  (OSRSApiService as unknown as Record<string, unknown>).fetchItemMapping = async () => [
    { id: 100, name: 'Test Item', limit: 0 },
  ];
  (OSRSApiService as unknown as Record<string, unknown>).fetch24hVolumes = async () => ({
    '100': { highPriceVolume: 50, lowPriceVolume: 50 },
  });
  (OSRSApiService as unknown as Record<string, unknown>).fetch1hHistory = async () => [
    { timestamp: 1000, avgHighPrice: 2000, avgLowPrice: 1900, highPriceVolume: 10, lowPriceVolume: 5 },
    { timestamp: 2000, avgHighPrice: 2100, avgLowPrice: 1950, highPriceVolume: 8, lowPriceVolume: 7 },
  ];

  await PriceService.syncItems();
  await PriceService.syncHistoricalPrices();

  const history = await prisma.priceHistory.findMany({ where: { itemId: 100 } });
  assert(history.length === 2, 'Historical prices should be inserted');

  console.log('historical sync test passed');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
