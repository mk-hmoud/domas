import { Injectable, OnModuleDestroy, OnModuleInit, Logger, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { databaseConfig } from '../../config';
import { AuditUserContext } from '../../common/interfaces/audit-user-context.interface';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @Inject(databaseConfig.KEY)
    private dbConfig: ConfigType<typeof databaseConfig>,
  ) {
    const connectionConfig: any = {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    if (this.dbConfig.url) {
      connectionConfig.connectionString = this.dbConfig.url;
    } else {
      connectionConfig.user = this.dbConfig.username;
      connectionConfig.host = this.dbConfig.host;
      connectionConfig.database = this.dbConfig.database;
      connectionConfig.password = this.dbConfig.password;
      connectionConfig.port = this.dbConfig.port;
    }

    this.pool = new Pool(connectionConfig);
  }

  async onModuleInit() {
    try {
      const client = await this.pool.connect();
      client.release();
      this.logger.log('Database connection established successfully');
    } catch (error) {
      this.logger.error('Database connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing database connections...');
    try {
      await this.pool.end();
      this.logger.log('Database connections closed successfully');
    } catch (error) {
      this.logger.error('Error closing database connections', error);
      throw error;
    }
  }

  public getPool(): Pool {
    return this.pool;
  }

  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  /**
   * TRANSACTION WRAPPER
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    userContext?: AuditUserContext,
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Injecting the context before running the query.
      if (userContext) {
        // sanity checks.
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userContext.userId)) {
          throw new Error(`Invalid UUID format for AuditUserContext.userId: ${userContext.userId}`);
        }

        // Basic IP validation (IPv4, IPv6, or IPv4-mapped IPv6)
        const ipRegex = /^[0-9a-fA-F:.]*$/;
        if (!ipRegex.test(userContext.ipAddress)) {
          throw new Error(
            `Invalid IP format for AuditUserContext.ipAddress: ${userContext.ipAddress}`,
          );
        }

        // We use set_config with is_local=true so it applies ONLY to this transaction
        await client.query(`SELECT set_config('app.user_id', $1, true)`, [userContext.userId]);
        await client.query(`SELECT set_config('app.username', $1, true)`, [userContext.username]);
        await client.query(`SELECT set_config('app.ip_address', $1, true)`, [
          userContext.ipAddress,
        ]);
        if (userContext.userAgent) {
          await client.query(`SELECT set_config('app.user_agent', $1, true)`, [
            userContext.userAgent,
          ]);
        }
      }

      const result = await callback(client);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(
        `Transaction failed, rolled back: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      client.release();
    }
  }
}
