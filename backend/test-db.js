// backend/test-db.js
const { Pool } = require('pg');

console.log('🔍 Iniciando teste de conexão...');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDatabase() {
  try {
    console.log('1. 🚀 Testando conexão...');
    const version = await pool.query('SELECT version()');
    console.log('✅ PostgreSQL conectado');

    console.log('2. 🗄️ Verificando banco...');
    const dbInfo = await pool.query('SELECT current_database(), current_user');
    console.log('   Banco:', dbInfo.rows[0].current_database);
    console.log('   Usuário:', dbInfo.rows[0].current_user);

    console.log('3. 📊 Listando tabelas...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('   Tabelas:');
    tables.rows.forEach(table => {
      console.log('   -', table.table_name);
    });

    console.log('4. 👥 Verificando tabela clientes...');
    const clientes = await pool.query('SELECT * FROM clientes');
    console.log('   Total de clientes:', clientes.rows.length);

    if (clientes.rows.length > 0) {
      clientes.rows.forEach((client, i) => {
        console.log(`   ${i + 1}. ${client.name} - ${client.email || 'sem email'}`);
      });
    } else {
      console.log('   ℹ️ Nenhum cliente encontrado');
    }

    console.log('🎉 Banco de dados funcionando!');

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();