/*
  Warnings:

  - You are about to drop the column `name1` on the `couples` table. All the data in the column will be lost.
  - You are about to drop the column `name2` on the `couples` table. All the data in the column will be lost.
  - Added the required column `name` to the `couples` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "couples" DROP COLUMN "name1",
DROP COLUMN "name2",
ADD COLUMN     "name" TEXT NOT NULL;
