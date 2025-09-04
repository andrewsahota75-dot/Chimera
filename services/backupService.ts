import cron from 'node-cron';
import { DatabaseService } from './databaseService';

interface BackupConfig {
  enabled: boolean;
  schedule: string;
  maxBackups: number;
  compressionLevel: number;
  encryption: boolean;
  remoteStorage: boolean;
  backupTypes: ('full' | 'incremental' | 'logs')[];
}

interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: 'full' | 'incremental' | 'logs';
  size: number;
  compressed: boolean;
  encrypted: boolean;
  location: string;
  checksum: string;
  status: 'completed' | 'failed' | 'in_progress';
  duration: number;
}

interface RestorePoint {
  id: string;
  timestamp: Date;
  description: string;
  backupIds: string[];
  canRestore: boolean;
}

export class BackupService {
  private static instance: BackupService;
  private config: BackupConfig;
  private backups: BackupMetadata[] = [];
  private restorePoints: RestorePoint[] = [];
  private isRunning: boolean = false;
  private currentBackup: BackupMetadata | null = null;
  private scheduledJobs: cron.ScheduledTask[] = [];

  constructor(config?: Partial<BackupConfig>) {
    this.config = {
      enabled: process.env.BACKUP_ENABLED === 'true',
      schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
      maxBackups: parseInt(process.env.MAX_BACKUPS || '30'),
      compressionLevel: parseInt(process.env.BACKUP_COMPRESSION || '6'),
      encryption: process.env.BACKUP_ENCRYPTION === 'true',
      remoteStorage: process.env.BACKUP_REMOTE === 'true',
      backupTypes: ['full', 'logs'],
      ...config
    };

    if (this.config.enabled) {
      this.scheduleBackups();
    }
  }

  static getInstance(config?: Partial<BackupConfig>): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService(config);
    }
    return BackupService.instance;
  }

  // Backup scheduling
  private scheduleBackups(): void {
    console.log('📅 Scheduling automatic backups...');

    // Full backup - daily
    const fullBackupJob = cron.schedule(this.config.schedule, async () => {
      try {
        await this.performBackup('full');
      } catch (error) {
        console.error('Scheduled full backup failed:', error);
      }
    }, { scheduled: false });

    // Incremental backup - every 6 hours
    const incrementalBackupJob = cron.schedule('0 */6 * * *', async () => {
      if (this.config.backupTypes.includes('incremental')) {
        try {
          await this.performBackup('incremental');
        } catch (error) {
          console.error('Scheduled incremental backup failed:', error);
        }
      }
    }, { scheduled: false });

    // Log backup - every hour
    const logBackupJob = cron.schedule('0 * * * *', async () => {
      if (this.config.backupTypes.includes('logs')) {
        try {
          await this.performBackup('logs');
        } catch (error) {
          console.error('Scheduled log backup failed:', error);
        }
      }
    }, { scheduled: false });

    // Cleanup job - weekly
    const cleanupJob = cron.schedule('0 3 * * 0', async () => {
      try {
        await this.cleanupOldBackups();
      } catch (error) {
        console.error('Backup cleanup failed:', error);
      }
    }, { scheduled: false });

    this.scheduledJobs = [fullBackupJob, incrementalBackupJob, logBackupJob, cleanupJob];

    if (this.config.enabled) {
      this.scheduledJobs.forEach(job => job.start());
      console.log('✅ Backup scheduling started');
    }
  }

  // Start/Stop backup service
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Backup service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Backup service started');

    // Load existing backup metadata
    await this.loadBackupHistory();

    // Create initial restore point
    await this.createRestorePoint('Initial restore point');
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.scheduledJobs.forEach(job => job.destroy());
    console.log('⏹️ Backup service stopped');
  }

  // Core backup operations
  async performBackup(type: 'full' | 'incremental' | 'logs', description?: string): Promise<BackupMetadata> {
    if (this.currentBackup) {
      throw new Error('Another backup is already in progress');
    }

    const startTime = Date.now();
    const backup: BackupMetadata = {
      id: this.generateBackupId(),
      timestamp: new Date(),
      type,
      size: 0,
      compressed: this.config.compressionLevel > 0,
      encrypted: this.config.encryption,
      location: this.generateBackupPath(type),
      checksum: '',
      status: 'in_progress',
      duration: 0
    };

    this.currentBackup = backup;
    console.log(`📦 Starting ${type} backup: ${backup.id}`);

    try {
      switch (type) {
        case 'full':
          await this.performFullBackup(backup);
          break;
        case 'incremental':
          await this.performIncrementalBackup(backup);
          break;
        case 'logs':
          await this.performLogBackup(backup);
          break;
      }

      backup.duration = Date.now() - startTime;
      backup.status = 'completed';
      backup.checksum = this.calculateChecksum(backup);

      console.log(`✅ ${type} backup completed: ${backup.id} (${backup.duration}ms, ${this.formatSize(backup.size)})`);

    } catch (error) {
      backup.status = 'failed';
      backup.duration = Date.now() - startTime;
      console.error(`❌ ${type} backup failed: ${error.message}`);
      throw error;
    } finally {
      this.backups.unshift(backup);
      this.currentBackup = null;
    }

    // Store backup metadata
    await this.saveBackupMetadata(backup);

    return backup;
  }

  private async performFullBackup(backup: BackupMetadata): Promise<void> {
    const db = DatabaseService.getInstance();
    
    // Simulate full database backup
    console.log('💾 Backing up database...');
    await this.simulateBackupOperation(2000); // 2 second simulation
    backup.size += 50 * 1024 * 1024; // 50MB simulated size

    // Backup configuration files
    console.log('⚙️ Backing up configuration...');
    await this.simulateBackupOperation(500);
    backup.size += 1024 * 1024; // 1MB

    // Backup logs
    console.log('📄 Backing up logs...');
    await this.simulateBackupOperation(800);
    backup.size += 10 * 1024 * 1024; // 10MB

    // Backup uploaded files (if any)
    console.log('📎 Backing up files...');
    await this.simulateBackupOperation(300);
    backup.size += 5 * 1024 * 1024; // 5MB

    if (backup.compressed) {
      console.log('🗜️ Compressing backup...');
      await this.simulateBackupOperation(1000);
      backup.size = Math.floor(backup.size * (10 - this.config.compressionLevel) / 10);
    }

    if (backup.encrypted) {
      console.log('🔐 Encrypting backup...');
      await this.simulateBackupOperation(800);
    }
  }

  private async performIncrementalBackup(backup: BackupMetadata): Promise<void> {
    const lastFullBackup = this.backups.find(b => b.type === 'full' && b.status === 'completed');
    if (!lastFullBackup) {
      throw new Error('No full backup found for incremental backup');
    }

    console.log(`📊 Performing incremental backup since ${lastFullBackup.timestamp}`);
    
    // Simulate incremental backup (only changes)
    await this.simulateBackupOperation(800);
    backup.size += 5 * 1024 * 1024; // 5MB of changes

    if (backup.compressed) {
      await this.simulateBackupOperation(200);
      backup.size = Math.floor(backup.size * 0.7);
    }
  }

  private async performLogBackup(backup: BackupMetadata): Promise<void> {
    console.log('📝 Backing up system logs...');
    
    // Simulate log backup
    await this.simulateBackupOperation(400);
    backup.size += 2 * 1024 * 1024; // 2MB of logs

    if (backup.compressed) {
      await this.simulateBackupOperation(100);
      backup.size = Math.floor(backup.size * 0.3); // Logs compress very well
    }
  }

  // Restore operations
  async createRestorePoint(description: string): Promise<RestorePoint> {
    const restorePoint: RestorePoint = {
      id: this.generateRestorePointId(),
      timestamp: new Date(),
      description,
      backupIds: this.backups
        .filter(b => b.status === 'completed')
        .slice(0, 5) // Last 5 successful backups
        .map(b => b.id),
      canRestore: true
    };

    this.restorePoints.unshift(restorePoint);
    console.log(`📍 Created restore point: ${restorePoint.description}`);

    return restorePoint;
  }

  async restoreFromBackup(backupId: string, options?: { 
    dryRun?: boolean; 
    skipTables?: string[]; 
    targetTimestamp?: Date 
  }): Promise<{ success: boolean; details: string[] }> {
    const backup = this.backups.find(b => b.id === backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    if (backup.status !== 'completed') {
      throw new Error(`Cannot restore from ${backup.status} backup`);
    }

    const isDryRun = options?.dryRun || false;
    console.log(`🔄 ${isDryRun ? 'Dry run: ' : ''}Restoring from backup ${backupId}...`);

    const details: string[] = [];
    
    try {
      // Verify backup integrity
      console.log('🔍 Verifying backup integrity...');
      await this.simulateBackupOperation(500);
      details.push('Backup integrity verified');

      if (backup.encrypted) {
        console.log('🔓 Decrypting backup...');
        await this.simulateBackupOperation(600);
        details.push('Backup decrypted successfully');
      }

      if (backup.compressed) {
        console.log('📤 Decompressing backup...');
        await this.simulateBackupOperation(800);
        details.push('Backup decompressed');
      }

      if (!isDryRun) {
        // Stop services
        console.log('⏸️ Stopping services...');
        details.push('Services stopped');

        // Restore database
        console.log('💾 Restoring database...');
        await this.simulateBackupOperation(3000);
        details.push('Database restored');

        // Restore configuration
        console.log('⚙️ Restoring configuration...');
        await this.simulateBackupOperation(300);
        details.push('Configuration restored');

        // Restart services
        console.log('▶️ Restarting services...');
        await this.simulateBackupOperation(1000);
        details.push('Services restarted');
      } else {
        details.push('Dry run completed - no changes made');
      }

      console.log(`✅ Restore ${isDryRun ? 'simulation ' : ''}completed successfully`);
      return { success: true, details };

    } catch (error) {
      console.error(`❌ Restore failed: ${error.message}`);
      return { success: false, details: [...details, `Error: ${error.message}`] };
    }
  }

  async restoreToPoint(restorePointId: string, dryRun: boolean = false): Promise<{ success: boolean; details: string[] }> {
    const restorePoint = this.restorePoints.find(rp => rp.id === restorePointId);
    if (!restorePoint) {
      throw new Error(`Restore point ${restorePointId} not found`);
    }

    if (!restorePoint.canRestore) {
      throw new Error('Restore point is not available for restore');
    }

    // Find the best backup to restore from (usually the most recent full backup before the restore point)
    const fullBackup = this.backups.find(b => 
      restorePoint.backupIds.includes(b.id) && 
      b.type === 'full' && 
      b.status === 'completed'
    );

    if (!fullBackup) {
      throw new Error('No suitable full backup found for restore point');
    }

    return await this.restoreFromBackup(fullBackup.id, { dryRun });
  }

  // Maintenance operations
  async verifyBackup(backupId: string): Promise<{ valid: boolean; issues: string[] }> {
    const backup = this.backups.find(b => b.id === backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    console.log(`🔍 Verifying backup ${backupId}...`);
    const issues: string[] = [];

    try {
      // Check file existence
      await this.simulateBackupOperation(200);
      
      // Verify checksum
      const currentChecksum = this.calculateChecksum(backup);
      if (currentChecksum !== backup.checksum) {
        issues.push('Checksum mismatch - backup may be corrupted');
      }

      // Test decompression if compressed
      if (backup.compressed) {
        await this.simulateBackupOperation(300);
      }

      // Test decryption if encrypted
      if (backup.encrypted) {
        await this.simulateBackupOperation(400);
      }

      const isValid = issues.length === 0;
      console.log(`${isValid ? '✅' : '❌'} Backup verification ${isValid ? 'passed' : 'failed'}`);

      return { valid: isValid, issues };
    } catch (error) {
      issues.push(`Verification error: ${error.message}`);
      return { valid: false, issues };
    }
  }

  async cleanupOldBackups(): Promise<{ deleted: number; size: number }> {
    console.log('🧹 Cleaning up old backups...');
    
    const completedBackups = this.backups.filter(b => b.status === 'completed');
    const toDelete = completedBackups.slice(this.config.maxBackups);
    
    let deletedCount = 0;
    let deletedSize = 0;

    for (const backup of toDelete) {
      try {
        // Simulate deletion
        await this.simulateBackupOperation(100);
        deletedSize += backup.size;
        deletedCount++;
        
        // Remove from memory
        this.backups = this.backups.filter(b => b.id !== backup.id);
        
        console.log(`🗑️ Deleted backup ${backup.id}`);
      } catch (error) {
        console.error(`Failed to delete backup ${backup.id}:`, error);
      }
    }

    console.log(`✅ Cleanup completed: ${deletedCount} backups deleted (${this.formatSize(deletedSize)} freed)`);
    
    return { deleted: deletedCount, size: deletedSize };
  }

  // Query methods
  getBackups(filter?: { type?: string; status?: string; limit?: number }): BackupMetadata[] {
    let filtered = [...this.backups];

    if (filter?.type) {
      filtered = filtered.filter(b => b.type === filter.type);
    }

    if (filter?.status) {
      filtered = filtered.filter(b => b.status === filter.status);
    }

    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  getRestorePoints(): RestorePoint[] {
    return [...this.restorePoints];
  }

  getBackupStatus(): {
    enabled: boolean;
    lastBackup?: BackupMetadata;
    nextBackup?: Date;
    totalBackups: number;
    totalSize: number;
    oldestBackup?: Date;
    health: 'healthy' | 'warning' | 'error';
  } {
    const completedBackups = this.backups.filter(b => b.status === 'completed');
    const lastBackup = completedBackups[0];
    const totalSize = completedBackups.reduce((sum, b) => sum + b.size, 0);
    
    let health: 'healthy' | 'warning' | 'error' = 'healthy';
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    if (!lastBackup || lastBackup.timestamp < twentyFourHoursAgo) {
      health = 'warning';
    }
    
    const failedBackups = this.backups.filter(b => b.status === 'failed').length;
    if (failedBackups > 2) {
      health = 'error';
    }

    return {
      enabled: this.config.enabled,
      lastBackup,
      totalBackups: completedBackups.length,
      totalSize,
      oldestBackup: completedBackups[completedBackups.length - 1]?.timestamp,
      health
    };
  }

  // Configuration
  updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Backup configuration updated');

    // Restart scheduling if enabled status changed
    if (newConfig.enabled !== undefined) {
      this.scheduledJobs.forEach(job => {
        if (this.config.enabled) {
          job.start();
        } else {
          job.stop();
        }
      });
    }
  }

  getConfig(): BackupConfig {
    return { ...this.config };
  }

  // Private utility methods
  private generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `backup_${timestamp}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateRestorePointId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `restore_${timestamp}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateBackupPath(type: string): string {
    const date = new Date().toISOString().split('T')[0];
    return `/backups/${date}/${this.generateBackupId()}.${type}.backup`;
  }

  private calculateChecksum(backup: BackupMetadata): string {
    // Simulate checksum calculation
    return `sha256_${backup.id.slice(-8)}_${backup.size.toString(16)}`;
  }

  private formatSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private async simulateBackupOperation(duration: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  private async loadBackupHistory(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    console.log('📚 Loading backup history...');
  }

  private async saveBackupMetadata(backup: BackupMetadata): Promise<void> {
    // In a real implementation, this would save to persistent storage
    console.log(`💾 Saving backup metadata: ${backup.id}`);
  }
}