#!/usr/bin/env node

/**
 * Database Cleanup Script for BroGolfTracker
 * 
 * This script cleans the database while preserving:
 * - Admin user (first user in the system)
 * - All golf courses and their holes
 * - Achievement definitions
 * 
 * It removes:
 * - All non-admin users
 * - All tournaments and rounds
 * - All scorecards and scores
 * - All tournament players associations
 * - All user achievements progress
 * - All payouts
 */

import { db } from './server/db.js';
import { 
  users, 
  tournaments, 
  rounds, 
  scorecards, 
  scores, 
  tournamentPlayers, 
  scorecardPlayers,
  userAchievements,
  payouts
} from './shared/schema.js';
import { eq, ne } from 'drizzle-orm';

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...');
  
  try {
    // Get the admin user (first user or explicit admin)
    const adminUsers = await db.select().from(users).where(eq(users.isAdmin, true)).limit(1);
    
    if (adminUsers.length === 0) {
      console.error('❌ No admin user found! Aborting cleanup to prevent total data loss.');
      process.exit(1);
    }
    
    const adminUser = adminUsers[0];
    console.log(`✅ Preserving admin user: ${adminUser.username} (${adminUser.firstName} ${adminUser.lastName})`);
    
    // Delete in correct order to respect foreign key constraints
    console.log('🗑️  Deleting scores...');
    await db.delete(scores);
    
    console.log('🗑️  Deleting scorecard players...');
    await db.delete(scorecardPlayers);
    
    console.log('🗑️  Deleting scorecards...');
    await db.delete(scorecards);
    
    console.log('🗑️  Deleting tournament players...');
    await db.delete(tournamentPlayers);
    
    console.log('🗑️  Deleting user achievements...');
    await db.delete(userAchievements);
    
    console.log('🗑️  Deleting payouts...');
    await db.delete(payouts);
    
    console.log('🗑️  Deleting rounds...');
    await db.delete(rounds);
    
    console.log('🗑️  Deleting tournaments...');
    await db.delete(tournaments);
    
    console.log('🗑️  Deleting non-admin users...');
    const deletedUsers = await db.delete(users).where(ne(users.id, adminUser.id));
    
    // Get counts of preserved data
    const courseCount = await db.execute(`SELECT COUNT(*) as count FROM courses`);
    const holeCount = await db.execute(`SELECT COUNT(*) as count FROM holes`);
    const achievementCount = await db.execute(`SELECT COUNT(*) as count FROM achievements`);
    
    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('\n📊 Preserved data:');
    console.log(`   👤 Admin user: ${adminUser.username}`);
    console.log(`   🏌️  Golf courses: ${courseCount.rows[0].count || 0}`);
    console.log(`   ⛳ Course holes: ${holeCount.rows[0].count || 0}`);
    console.log(`   🏆 Achievement definitions: ${achievementCount.rows[0].count || 0}`);
    
    console.log('\n✨ Database is now clean and ready for production use!');
    console.log('\n📋 Next steps:');
    console.log('   1. Create new tournament');
    console.log('   2. Add players to system');
    console.log('   3. Associate players with tournament');
    console.log('   4. Add rounds and start scoring');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupDatabase().then(() => {
  process.exit(0);
});