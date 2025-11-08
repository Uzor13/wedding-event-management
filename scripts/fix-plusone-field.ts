// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

// Now import everything else
import mongoose from 'mongoose';
import Guest from '../lib/models/Guest';
import dbConnect from '../lib/db/mongodb';

async function fixPlusOneField() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Find all guests where plusOneAllowed is undefined or doesn't exist
    const guestsToUpdate = await Guest.find({
      $or: [
        { plusOneAllowed: { $exists: false } },
        { plusOneAllowed: null },
        { plusOneAllowed: undefined }
      ]
    });

    console.log(`Found ${guestsToUpdate.length} guests with undefined/null plusOneAllowed`);

    // Update each guest to set plusOneAllowed to false
    const result = await Guest.updateMany(
      {
        $or: [
          { plusOneAllowed: { $exists: false } },
          { plusOneAllowed: null },
          { plusOneAllowed: undefined }
        ]
      },
      { $set: { plusOneAllowed: false } }
    );

    console.log(`Updated ${result.modifiedCount} guests`);

    // Verify the fix
    const allGuests = await Guest.find().select('name plusOneAllowed');
    console.log('\nAll guests after update:');
    allGuests.forEach(guest => {
      console.log(`  ${guest.name}: plusOneAllowed = ${guest.plusOneAllowed}`);
    });

    // Show counts
    const totalGuests = await Guest.countDocuments();
    const withPlusOne = await Guest.countDocuments({ plusOneAllowed: true });
    const withoutPlusOne = await Guest.countDocuments({ plusOneAllowed: false });

    console.log(`\nTotal guests: ${totalGuests}`);
    console.log(`With plus one allowed: ${withPlusOne}`);
    console.log(`Without plus one allowed: ${withoutPlusOne}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPlusOneField();
