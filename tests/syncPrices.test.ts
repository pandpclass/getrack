import { execSync } from 'child_process';
import assert from 'assert';
import prisma from '../src/lib/database.js';
import { PriceService } from '../src/server/services/price-service.js';
import { OSRSApiService } from '../src/server/services/osrs-api.js';

async function run() {
  // Use an isolated SQLite database for testing
  process.env.DATABASE_URL = 'file:./tests/test.db';

  // Reset schema for a clean environment
  execSync('npx prisma db push --force-reset > /dev/null');

  // Mock price and item mapping responses
  (OSRSApiService as unknown as Record<string, unknown>).fetchLatestPrices = async () => ({
    '999': { high: 1000, low: 900 },
  });

  let mappingCalls = 0;
  (OSRSApiService as unknown as Record<string, unknown>).fetchItemMapping = async () => {
    mappingCalls += 1;
    if (mappingCalls === 1) return [];
    return [{ id: 999, name: 'Test Item', limit: 0 }];
  };

  await PriceService.syncPrices();

  const item = await prisma.item.findUnique({ where: { id: 999 } });
  const price = await prisma.price.findFirst({ where: { itemId: 999 } });

  assert(item, 'Item should be created when missing');
  assert(price, 'Price should be stored for new item');

  console.log('syncPrices test passed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
