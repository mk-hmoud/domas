import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { pipeline } from 'stream/promises';

export interface BackupFile {
  name: string;
  sizeBytes: number;
  createdAt: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;
  private readonly retainCount: number;

  constructor(private readonly config: ConfigService) {
    this.backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
    this.retainCount = parseInt(process.env.BACKUP_RETAIN_COUNT || '14', 10);
    fs.mkdirSync(this.backupDir, { recursive: true });
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runScheduledBackup() {
    this.logger.log('Running scheduled nightly backup');
    await this.createBackup();
  }

  async createBackup(): Promise<BackupFile> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql.gz`;
    const filePath = path.join(this.backupDir, filename);

    const dbUrl = this.config.get<string>('database.url');
    const env: Record<string, string> = { ...(process.env as Record<string, string>) };

    const pgDumpArgs: string[] = ['--no-password', '--clean', '--if-exists'];

    if (dbUrl) {
      pgDumpArgs.push(dbUrl);
    } else {
      const host = this.config.get<string>('database.host') || 'localhost';
      const port = String(this.config.get<number>('database.port') || 5432);
      const user = this.config.get<string>('database.username') || 'postgres';
      const password = this.config.get<string>('database.password') || '';
      const database = this.config.get<string>('database.database') || 'domas';

      pgDumpArgs.push('-h', host, '-p', port, '-U', user, database);
      if (password) env['PGPASSWORD'] = password;
    }

    await new Promise<void>((resolve, reject) => {
      const dump = spawn('pg_dump', pgDumpArgs, { env });
      const gzip = zlib.createGzip();
      const out = fs.createWriteStream(filePath);

      dump.stderr.on('data', (d: Buffer) => {
        const msg = d.toString().trim();
        if (msg) this.logger.warn(`pg_dump: ${msg}`);
      });

      pipeline(dump.stdout, gzip, out).then(resolve).catch(reject);

      dump.on('error', reject);
      dump.on('close', (code) => {
        if (code !== 0) reject(new Error(`pg_dump exited with code ${code}`));
      });
    });

    const stat = fs.statSync(filePath);
    const MIN_BACKUP_BYTES = 10 * 1024; // 10 KB — a valid dump is always larger
    if (stat.size < MIN_BACKUP_BYTES) {
      fs.unlinkSync(filePath);
      throw new Error(
        `Backup file suspiciously small (${stat.size} bytes) — pg_dump may have failed silently`,
      );
    }
    this.logger.log(`Backup created: ${filename} (${stat.size} bytes)`);

    await this.pruneOldBackups();

    return {
      name: filename,
      sizeBytes: stat.size,
      createdAt: new Date().toISOString(),
    };
  }

  listBackups(): BackupFile[] {
    const files = fs
      .readdirSync(this.backupDir)
      .filter((f) => f.endsWith('.sql.gz'))
      .map((name) => {
        const stat = fs.statSync(path.join(this.backupDir, name));
        return {
          name,
          sizeBytes: stat.size,
          createdAt: stat.birthtime.toISOString(),
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return files;
  }

  getBackupFilePath(name: string): string {
    if (!name.match(/^backup-[\w-]+\.sql\.gz$/)) {
      throw new NotFoundException('Backup not found');
    }
    const filePath = path.join(this.backupDir, name);
    if (!fs.existsSync(filePath)) throw new NotFoundException('Backup not found');
    return filePath;
  }

  deleteBackup(name: string): void {
    const filePath = this.getBackupFilePath(name);
    fs.unlinkSync(filePath);
  }

  private async pruneOldBackups() {
    const files = this.listBackups();
    const toDelete = files.slice(this.retainCount);
    for (const f of toDelete) {
      fs.unlinkSync(path.join(this.backupDir, f.name));
      this.logger.log(`Pruned old backup: ${f.name}`);
    }
  }
}
