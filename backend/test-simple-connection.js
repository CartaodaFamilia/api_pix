// backend/test-simple-connection.js
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

async function test() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'pix_automatico',
    user: 'postgres',
    password: '1234',
  });

  try {
    console.log('🔌 Testando conexão...');
    const result = await pool.query('SELECT * FROM clientes ORDER BY id');
    console.log(`✅ ${result.rows.length} clientes encontrados:`);
    result.rows.forEach(client => {
      console.log(`   - ${client.name} (${client.email})`);
    });
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

test();