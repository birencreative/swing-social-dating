import { Pool } from 'pg';
import { config } from '@/config';

// Prevent duplicate pool instantiations on Fast Refresh in development
const globalForPg = global as unknown as { pgPool: Pool };

export const dbPool = globalForPg.pgPool || new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.name,
  password: config.db.password,
  port: config.db.port,
  max: 20,                          // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,         // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000,    // Return an error if a connection takes longer than 5 seconds
});

if (process.env.NODE_ENV !== 'production') {
  globalForPg.pgPool = dbPool;
}

// Utility to perform quick queries without having to connect/release manually
export const query = (text: string, params?: any[]) => {
  return dbPool.query(text, params);
};

export default dbPool;
