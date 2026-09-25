-- Migration: Create Roles table
CREATE TABLE IF NOT EXISTS "Roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Roles_name_key" ON "Roles"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Roles_slug_key" ON "Roles"("slug");
