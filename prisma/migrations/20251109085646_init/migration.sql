-- CreateTable
CREATE TABLE "couples" (
    "id" TEXT NOT NULL,
    "name1" TEXT,
    "name2" TEXT,
    "weddingDate" TIMESTAMP(3),
    "email" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL DEFAULT 'Wedding Invitation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "couples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "rsvpStatus" BOOLEAN NOT NULL DEFAULT false,
    "uniqueId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "qrCode" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "plusOneAllowed" BOOLEAN NOT NULL DEFAULT false,
    "plusOneName" TEXT,
    "plusOnePhone" TEXT,
    "plusOneRsvp" BOOLEAN NOT NULL DEFAULT false,
    "mealPreference" TEXT,
    "plusOneMealPreference" TEXT,
    "dietaryRestrictions" TEXT,
    "plusOneDietaryRestrictions" TEXT,
    "tableName" TEXT,
    "tableNumber" INTEGER,
    "seatingAssigned" BOOLEAN NOT NULL DEFAULT false,
    "coupleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "coupleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL DEFAULT 'You''re Invited to Our Wedding',
    "coupleNames" TEXT NOT NULL DEFAULT 'The Happy Couple',
    "eventDate" TEXT,
    "eventTime" TEXT,
    "venueName" TEXT,
    "venueAddress" TEXT,
    "colorOfDay" TEXT NOT NULL DEFAULT 'White, Coffee and Beige',
    "primaryColor" TEXT NOT NULL DEFAULT '#6F4E37',
    "secondaryColor" TEXT NOT NULL DEFAULT '#8B7355',
    "accentColor" TEXT NOT NULL DEFAULT '#F5E9D3',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "textColor" TEXT NOT NULL DEFAULT '#000000',
    "qrBackgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'other',
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "venueName" TEXT NOT NULL,
    "venueAddress" TEXT NOT NULL,
    "description" TEXT,
    "dressCode" TEXT,
    "isMainEvent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_registry" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "purchaseLink" TEXT,
    "imageUrl" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'other',
    "uploadedBy" TEXT NOT NULL DEFAULT 'admin',
    "uploaderName" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_items" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "time" TEXT NOT NULL,
    "duration" INTEGER,
    "order" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GuestTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GuestTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_EventGuests" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventGuests_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "couples_username_key" ON "couples"("username");

-- CreateIndex
CREATE UNIQUE INDEX "guests_uniqueId_key" ON "guests"("uniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "guests_code_key" ON "guests"("code");

-- CreateIndex
CREATE INDEX "guests_coupleId_idx" ON "guests"("coupleId");

-- CreateIndex
CREATE INDEX "guests_uniqueId_idx" ON "guests"("uniqueId");

-- CreateIndex
CREATE INDEX "guests_code_idx" ON "guests"("code");

-- CreateIndex
CREATE INDEX "guests_rsvpStatus_coupleId_idx" ON "guests"("rsvpStatus", "coupleId");

-- CreateIndex
CREATE INDEX "guests_isUsed_coupleId_idx" ON "guests"("isUsed", "coupleId");

-- CreateIndex
CREATE INDEX "guests_name_coupleId_idx" ON "guests"("name", "coupleId");

-- CreateIndex
CREATE INDEX "tags_coupleId_idx" ON "tags"("coupleId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_coupleId_key" ON "tags"("name", "coupleId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_coupleId_key" ON "settings"("coupleId");

-- CreateIndex
CREATE INDEX "settings_coupleId_idx" ON "settings"("coupleId");

-- CreateIndex
CREATE INDEX "budget_items_coupleId_idx" ON "budget_items"("coupleId");

-- CreateIndex
CREATE INDEX "budget_items_category_coupleId_idx" ON "budget_items"("category", "coupleId");

-- CreateIndex
CREATE INDEX "budget_items_paid_coupleId_idx" ON "budget_items"("paid", "coupleId");

-- CreateIndex
CREATE INDEX "events_coupleId_idx" ON "events"("coupleId");

-- CreateIndex
CREATE INDEX "events_date_coupleId_idx" ON "events"("date", "coupleId");

-- CreateIndex
CREATE INDEX "events_eventType_coupleId_idx" ON "events"("eventType", "coupleId");

-- CreateIndex
CREATE INDEX "gift_registry_coupleId_idx" ON "gift_registry"("coupleId");

-- CreateIndex
CREATE INDEX "gift_registry_category_coupleId_idx" ON "gift_registry"("category", "coupleId");

-- CreateIndex
CREATE INDEX "messages_coupleId_approved_idx" ON "messages"("coupleId", "approved");

-- CreateIndex
CREATE INDEX "messages_coupleId_createdAt_idx" ON "messages"("coupleId", "createdAt");

-- CreateIndex
CREATE INDEX "photos_coupleId_category_idx" ON "photos"("coupleId", "category");

-- CreateIndex
CREATE INDEX "photos_coupleId_createdAt_idx" ON "photos"("coupleId", "createdAt");

-- CreateIndex
CREATE INDEX "photos_coupleId_order_idx" ON "photos"("coupleId", "order");

-- CreateIndex
CREATE INDEX "timeline_items_coupleId_order_idx" ON "timeline_items"("coupleId", "order");

-- CreateIndex
CREATE INDEX "_GuestTags_B_index" ON "_GuestTags"("B");

-- CreateIndex
CREATE INDEX "_EventGuests_B_index" ON "_EventGuests"("B");

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_registry" ADD CONSTRAINT "gift_registry_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GuestTags" ADD CONSTRAINT "_GuestTags_A_fkey" FOREIGN KEY ("A") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GuestTags" ADD CONSTRAINT "_GuestTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventGuests" ADD CONSTRAINT "_EventGuests_A_fkey" FOREIGN KEY ("A") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventGuests" ADD CONSTRAINT "_EventGuests_B_fkey" FOREIGN KEY ("B") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
