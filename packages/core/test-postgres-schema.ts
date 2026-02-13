import { PrismaClient } from './src/generated/prisma-postgres/index.js';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

async function test() {
  const connectionString = 'postgres://katasumi:dev_password@localhost:5432/katasumi_dev';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Testing User table schema...');
    
    // Test that we can query for users (even if empty)
    const users = await prisma.user.findMany({ take: 1 });
    console.log('✓ User table exists');
    console.log(`Found ${users.length} user(s)`);
    
    // Test that we can query specific fields including passwordHash
    const userCheck = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        passwordHash: true,
        tier: true,
        subscriptionStatus: true,
        aiKeyMode: true,
        aiProvider: true,
      }
    });
    console.log('✓ All User fields including passwordHash are accessible');
    
    console.log('\nTesting other web tables...');
    await prisma.userShortcut.findMany({ take: 1 });
    console.log('✓ UserShortcut table exists');
    
    await prisma.collection.findMany({ take: 1 });
    console.log('✓ Collection table exists');
    
    await prisma.aiUsage.findMany({ take: 1 });
    console.log('✓ AiUsage table exists');
    
    await prisma.subscription.findMany({ take: 1 });
    console.log('✓ Subscription table exists');
    
    console.log('\n✅ All schema tests passed!');
  } catch (error) {
    console.error('❌ Schema test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();
