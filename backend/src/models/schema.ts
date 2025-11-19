// backend/src/models/schema.ts - CORRIGIDO
import { pgTable, serial, varchar, timestamp, decimal, text, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const clients = pgTable('clientes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  cpf: varchar('cpf', { length: 14 }),
  phone: varchar('phone', { length: 20 }),
  created_at: timestamp('created_at').defaultNow(),
});

export const recurrences = pgTable('recurrences', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  frequency: varchar('frequency', { length: 50 }).notNull(), // MONTHLY, WEEKLY, etc
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  status: varchar('status', { length: 50 }).default('ACTIVE'),
  santanderRecurrenceId: varchar('santander_recurrence_id', { length: 255 }),
  locationUrl: varchar('location_url', { length: 512 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  recurrenceId: integer('recurrence_id').references(() => recurrences.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: varchar('status', { length: 50 }).default('PENDING'), // PENDING, PAID, FAILED
  santanderTxId: varchar('santander_tx_id', { length: 255 }),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Exportar apenas o que é necessário
export default {
  clients,
};