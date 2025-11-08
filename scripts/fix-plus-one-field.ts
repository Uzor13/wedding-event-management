import mongoose from 'mongoose';
import Guest from '../lib/models/Guest';
import dbConnect from '../lib/db/mongodb';

async function fixPlusOneField() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Update all guests that don't have plusOneAllowed field set
    const result = await Guest.updateMany(
      { plusOneAllowed: { $exists: false } },
      { $set: { plusOneAllowed: false } }
    );

    console.log(`Updated ${result.modifiedCount} guests with missing plusOneAllowed field`);

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
