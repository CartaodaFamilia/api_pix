// backend/test-drizzle.js
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');

async function testDrizzle() {
  console.log('🧪 Testando Drizzle ORM...\n');
  
  // Método 1: Pool explícito
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'pix_automatico',
    user: 'postgres',
    password: '1234',
    ssl: false,
  });

  const db = drizzle(pool);

  try {
    console.log('1. 🔌 Testando conexão básica...');
    const test = await db.execute('SELECT version()');
    console.log('   ✅ Conexão estabelecida');

    console.log('2. 📊 Testando consulta à tabela clientes...');
    const clients = await db.execute('SELECT * FROM clientes');
    console.log(`   ✅ ${clients.rows.length} clientes encontrados`);

    console.log('3. 🏗️ Testando Drizzle query builder...');
    const drizzleClients = await db.select().from({ clients });
    console.log(`   ✅ Drizzle funcionando: ${drizzleClients.length} clientes`);

    console.log('\n🎉 Drizzle ORM funcionando perfeitamente!');
    
  } catch (error) {
    console.error('❌ Erro no Drizzle:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testDrizzle();