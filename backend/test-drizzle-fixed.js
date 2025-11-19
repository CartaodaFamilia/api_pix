// backend/test-drizzle-fixed.js
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { clients } = require('./src/models/schema');

async function testDrizzleFixed() {
  console.log('🧪 Testando Drizzle ORM Corrigido...\n');
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'pix_automatico',
    user: 'postgres',
    password: '1234',
    ssl: false,
  });

  const db = drizzle(pool, { schema: { clients } });

  try {
    console.log('1. 🔌 Testando conexão básica...');
    const test = await db.execute('SELECT version()');
    console.log('   ✅ Conexão estabelecida');

    console.log('2. 📊 Testando consulta SQL direto...');
    const sqlResult = await db.execute('SELECT * FROM clientes');
    console.log(`   ✅ SQL direto: ${sqlResult.rows.length} clientes`);

    console.log('3. 🏗️ Testando Drizzle query builder...');
    const drizzleResult = await db.select().from(clients);
    console.log(`   ✅ Drizzle query: ${drizzleResult.length} clientes`);
    
    drizzleResult.forEach((client, i) => {
      console.log(`      ${i + 1}. ${client.name} - ${client.email}`);
    });

    console.log('\n🎉 Drizzle ORM funcionando perfeitamente!');
    
  } catch (error) {
    console.error('❌ Erro no Drizzle:', error.message);
  } finally {
    await pool.end();
  }
}

testDrizzleFixed();