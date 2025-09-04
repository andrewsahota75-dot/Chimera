
#!/bin/bash

# Chimera Trading Terminal Backup Script
# Creates a backup of the database and important configuration files

# Set variables
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="chimera_backup_$DATE"
DB_BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}_database.sql"
CONFIG_BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting Chimera Trading Terminal backup..."
echo "Backup directory: $BACKUP_DIR"
echo "Backup timestamp: $DATE"

# Backup database (if using PostgreSQL)
if command -v pg_dump &> /dev/null; then
    echo "Backing up PostgreSQL database..."
    pg_dump $DATABASE_URL > "$DB_BACKUP_FILE" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "Database backup created: $DB_BACKUP_FILE"
    else
        echo "Warning: Database backup failed or no database configured"
    fi
else
    echo "PostgreSQL not found, skipping database backup"
fi

# Backup configuration files and important data
echo "Backing up configuration files..."
tar -czf "$CONFIG_BACKUP_FILE" \
    --exclude="node_modules" \
    --exclude="dist" \
    --exclude=".git" \
    --exclude="backups" \
    --exclude="*.log" \
    .env.example \
    package.json \
    tsconfig.json \
    vite.config.ts \
    tailwind.config.js \
    prisma/ \
    scripts/ \
    docker-compose.yml \
    .replit \
    2>/dev/null

if [ $? -eq 0 ]; then
    echo "Configuration backup created: $CONFIG_BACKUP_FILE"
else
    echo "Warning: Configuration backup failed"
fi

# Clean up old backups (keep last 10)
echo "Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -t chimera_backup_* | tail -n +11 | xargs -r rm
cd ..

echo "Backup completed successfully!"
echo "Files created:"
if [ -f "$DB_BACKUP_FILE" ]; then
    echo "  - Database: $DB_BACKUP_FILE"
fi
if [ -f "$CONFIG_BACKUP_FILE" ]; then
    echo "  - Config: $CONFIG_BACKUP_FILE"
fi

# Show backup size
if [ -f "$CONFIG_BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$CONFIG_BACKUP_FILE" | cut -f1)
    echo "Total backup size: $BACKUP_SIZE"
fi
