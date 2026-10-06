-- Ensure default 'user' role exists in Roles table
INSERT OR IGNORE INTO "Roles" ("id", "name", "slug", "description", "createdAt", "updatedAt")
VALUES (1, 'user', 'user', 'Default user role', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Redefine Users table to replace 'role' column with required 'roleId' foreign key referencing Roles(id)
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Users" ("id", "fullname", "email", "password", "roleId", "verified", "createdAt", "updatedAt")
SELECT "id", "fullname", "email", "password", (SELECT "id" FROM "Roles" WHERE LOWER("name") = 'user' LIMIT 1), "verified", "createdAt", "updatedAt" FROM "Users";

DROP TABLE "Users";

ALTER TABLE "new_Users" RENAME TO "Users";

CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
