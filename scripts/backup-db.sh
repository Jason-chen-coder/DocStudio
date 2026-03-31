#!/bin/sh
# DocStudio PostgreSQL 自动备份脚本
# 用法：
#   ./scripts/backup-db.sh                    # 手动备份
#   docker compose -f docker-compose.prod.yml run --rm db-backup  # Docker 方式
#
# 环境变量（有默认值）：
#   PGHOST, PGUSER, PGDATABASE, BACKUP_DIR, BACKUP_RETAIN_DAYS

set -eu

PGHOST="${PGHOST:-postgres}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-docstudio}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-30}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILENAME="${PGDATABASE}_${TIMESTAMP}.sql.gz"

echo "[backup] $(date '+%Y-%m-%d %H:%M:%S') Starting backup of ${PGDATABASE}..."

# 创建备份目录
mkdir -p "${BACKUP_DIR}"

# 执行备份（压缩）
pg_dump -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" --no-owner --no-privileges | gzip > "${BACKUP_DIR}/${FILENAME}"

FILESIZE="$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)"
echo "[backup] Backup complete: ${FILENAME} (${FILESIZE})"

# 清理过期备份
if [ "${BACKUP_RETAIN_DAYS}" -gt 0 ]; then
  DELETED=$(find "${BACKUP_DIR}" -name "${PGDATABASE}_*.sql.gz" -mtime +"${BACKUP_RETAIN_DAYS}" -delete -print | wc -l)
  if [ "${DELETED}" -gt 0 ]; then
    echo "[backup] Cleaned up ${DELETED} backup(s) older than ${BACKUP_RETAIN_DAYS} days"
  fi
fi

echo "[backup] Done."
