// backend/create-table.js
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

async function createTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🛠️ Criando tabela clientes...');
    
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
    
    // Inserir dados de teste
    await pool.query(`
      INSERT INTO clientes (name, email, cpf, phone) VALUES 
      ('João Silva', 'joao@email.com', '123.456.789-00', '(11) 99999-9999'),
      ('Maria Santos', 'maria@email.com', '987.654.321-00', '(11) 88888-8888')
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('✅ Dados de teste inseridos');
    
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