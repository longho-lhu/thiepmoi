-- CreateTable
CREATE TABLE "Wedding" (
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

-- CreateTable
CREATE TABLE "Photo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "file" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "side" TEXT NOT NULL DEFAULT 'chung',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Rsvp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guestId" INTEGER,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "attending" BOOLEAN NOT NULL,
    "headcount" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rsvp_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Wish" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_code_key" ON "Guest"("code");
