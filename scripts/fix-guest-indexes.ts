import { config } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';

// Load environment variables FIRST
config({ path: resolve(process.cwd(), '.env.local') });

async function fixGuestIndexes() {
  try {
    console.log('Connecting to database...');

    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    console.log('\nGetting Guest collection...');
    const collection = mongoose.connection.collection('guests');

    // Get all existing indexes
    console.log('\nCurrent indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log('  -', JSON.stringify(index.key), index.unique ? '(unique)' : '');
    });

    // Drop the old phoneNumber unique index if it exists
    try {
      console.log('\nAttempting to drop old phoneNumber index...');
      await collection.dropIndex('phoneNumber_1');
      console.log('✓ Dropped old phoneNumber_1 index');
    } catch (error: any) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('✓ Old phoneNumber_1 index does not exist (already removed or never existed)');
      } else {
        console.error('Error dropping index:', error.message);
      }
    }

    // Ensure the compound index exists
    console.log('\nEnsuring correct compound index exists...');
    await collection.createIndex(
      { phoneNumber: 1, couple: 1 },
      { unique: true, name: 'phoneNumber_1_couple_1' }
    );
    console.log('✓ Compound index { phoneNumber: 1, couple: 1 } is in place');

    // Show final indexes
    console.log('\nFinal indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log('  -', JSON.stringify(index.key), index.unique ? '(unique)' : '');
    });

    console.log('\n✓ Index migration completed successfully!');
    console.log('You can now add guests with the same phone number for different couples.');

    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
}

fixGuestIndexes();
