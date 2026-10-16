-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Wedding" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "groomName" TEXT NOT NULL,
    "groomRole" TEXT NOT NULL,
    "groomFather" TEXT NOT NULL,
    "groomMother" TEXT NOT NULL,
    "groomAddress" TEXT NOT NULL,
    "brideName" TEXT NOT NULL,
    "brideRole" TEXT NOT NULL,
    "brideFather" TEXT NOT NULL,
    "brideMother" TEXT NOT NULL,
    "brideAddress" TEXT NOT NULL,
    "ceremonyAt" DATETIME NOT NULL,
    "ceremonyPlace" TEXT NOT NULL,
    "receptionAt" DATETIME NOT NULL,
    "partyAt" DATETIME NOT NULL,
    "venueName" TEXT NOT NULL,
    "venueAddress" TEXT NOT NULL,
    "showDressCode" BOOLEAN NOT NULL DEFAULT true,
    "dressCodeNote" TEXT,
    "dressCodeColors" TEXT NOT NULL DEFAULT '[]',
    "schedule" TEXT NOT NULL DEFAULT '[]',
    "groomBankBin" TEXT,
    "groomBankName" TEXT,
    "groomAccountNo" TEXT,
    "groomAccountName" TEXT,
    "brideBankBin" TEXT,
    "brideBankName" TEXT,
    "brideAccountNo" TEXT,
    "brideAccountName" TEXT,
    "musicFile" TEXT,
    "coverImage" TEXT,
    "closingMessage" TEXT NOT NULL DEFAULT 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Wedding" ("brideAccountName", "brideAccountNo", "brideAddress", "brideBankBin", "brideBankName", "brideFather", "brideMother", "brideName", "brideRole", "ceremonyAt", "ceremonyPlace", "closingMessage", "coverImage", "dressCodeColors", "dressCodeNote", "groomAccountName", "groomAccountNo", "groomAddress", "groomBankBin", "groomBankName", "groomFather", "groomMother", "groomName", "groomRole", "id", "musicFile", "partyAt", "receptionAt", "schedule", "updatedAt", "venueAddress", "venueName") SELECT "brideAccountName", "brideAccountNo", "brideAddress", "brideBankBin", "brideBankName", "brideFather", "brideMother", "brideName", "brideRole", "ceremonyAt", "ceremonyPlace", "closingMessage", "coverImage", "dressCodeColors", "dressCodeNote", "groomAccountName", "groomAccountNo", "groomAddress", "groomBankBin", "groomBankName", "groomFather", "groomMother", "groomName", "groomRole", "id", "musicFile", "partyAt", "receptionAt", "schedule", "updatedAt", "venueAddress", "venueName" FROM "Wedding";
DROP TABLE "Wedding";
ALTER TABLE "new_Wedding" RENAME TO "Wedding";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
