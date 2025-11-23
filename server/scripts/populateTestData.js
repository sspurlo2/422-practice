/**
 * Script to populate test database with dummy member data
 * 
 * Usage: node server/scripts/populateTestData.js [count]
 * 
 * This script safely creates test members in the database.
 * All test members use @test.uoregon.edu email domain for easy identification.
 * 
 * SAFETY: Only works in development/test environments
 */

require('dotenv').config();
const { createTestMember, cleanupTestMembers } = require('../utils/generateDummyData');
const { Role, Workplace } = require('../models');

async function populateTestData(count = 10) {
  // Check environment
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    console.error('❌ ERROR: Cannot populate test data in production environment!');
    process.exit(1);
  }

  console.log(`\n🧪 Populating test database with ${count} members...`);
  console.log(`   Environment: ${env}`);
  console.log(`   All test members will use @test.uoregon.edu email domain\n`);

  try {
    // Clean up any existing test data first
    const deleted = await cleanupTestMembers();
    if (deleted > 0) {
      console.log(`   Cleaned up ${deleted} existing test members\n`);
    }

    // Get available roles and workplaces for realistic data
    const roles = await Role.findAll();
    const workplaces = await Workplace.findAll();

    const createdMembers = [];

    for (let i = 0; i < count; i++) {
      const overrides = {};
      
      // Randomly assign role and workplace if available
      if (roles.length > 0) {
        const randomRole = roles[Math.floor(Math.random() * roles.length)];
        overrides.role_id = randomRole.id;
      }
      
      if (workplaces.length > 0) {
        const randomWorkplace = workplaces[Math.floor(Math.random() * workplaces.length)];
        overrides.workplace_id = randomWorkplace.id;
      }

      const member = await createTestMember(overrides);
      createdMembers.push(member);
      console.log(`   ✓ Created: ${member.name} (${member.email})`);
    }

    console.log(`\n✅ Successfully created ${createdMembers.length} test members!`);
    console.log(`\n   To clean up, run: node server/scripts/cleanupTestData.js\n`);

  } catch (error) {
    console.error('❌ Error populating test data:', error.message);
    process.exit(1);
  }
}

// Get count from command line argument
const count = parseInt(process.argv[2]) || 10;

// Run the script
populateTestData(count)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

