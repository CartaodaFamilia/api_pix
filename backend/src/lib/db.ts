import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../models/schema';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pix_automatico',
  user: 'postgres',
  password: '1234',
});

// Configuração CORRETA para query builder
export const db = drizzle(pool, { 
  schema,
  logger: true 
});