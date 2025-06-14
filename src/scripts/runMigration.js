// src/scripts/runMigration.js
import { migrateUsersToDenormalizedStructure } from '../utils/firestoreMigration';

const runMigration = async () => {
  console.log('Starting Firestore migration...');
  
  try {
    await migrateUsersToDenormalizedStructure();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  runMigration();
}

export default runMigration;