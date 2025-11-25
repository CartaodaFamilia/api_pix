// backend/create-table.js
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

async function createTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🛠️ Criando tabela clientes...');
    
    // --- LINHAS ADICIONADAS PARA LIMPEZA ---
    await pool.query('TRUNCATE TABLE clientes RESTART IDENTITY CASCADE;');
    console.log('✅ Tabela clientes limpa.');
    // -------------------------------------

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        cpf VARCHAR(14),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Tabela clientes criada/verificada');
    
    // Verificar
    const result = await pool.query('SELECT * FROM clientes');
    console.log(`📊 Total de clientes: ${result.rows.length}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

createTable();