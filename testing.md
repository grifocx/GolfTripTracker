# Golf Tournament Weekend Setup - Admin Testing Guide

## Overview
This guide provides a comprehensive end-to-end testing script for administrators setting up a golf tournament weekend. Follow these steps to ensure all systems are properly configured before your golf weekend begins.

## Prerequisites
- Admin access to the BroGolfTracker system
- Tournament dates and course details
- Player list with handicap information
- Buy-in amounts determined

## Testing Script

### Phase 1: User Management & Authentication
**Test Duration: 10 minutes**

1. **Login as Admin**
   - Navigate to the application
   - Login with admin credentials
   - Verify "Admin" badge appears in header
   - Check that admin-only menu items are visible

2. **Player Registration**
   - Go to "Players" section
   - Verify existing players are displayed with handicaps
   - Test adding a new player (if needed):
     - Click "Add Player"
     - Fill in: Username, Email, First Name, Last Name, Handicap Index
     - Submit and verify player appears in list
   - Verify handicap calculations look correct

**Expected Results:**
- All players visible with accurate handicap data
- Admin interface fully accessible
- Player data properly formatted

### Phase 2: Course Management
**Test Duration: 15 minutes**

1. **Course Verification**
   - Navigate to "Courses" section
   - Verify all golf courses are listed
   - Check each course shows:
     - Name and location
     - Total par and yardage
     - Hole count (should be 18/18)
     - Course rating and slope

2. **Hole Data Verification**
   - Switch to "Hole Management" tab
   - Select each course to verify:
     - All 18 holes are configured
     - Each hole has: number, par, yardage, handicap ranking
     - Handicap rankings use numbers 1-18 (no duplicates)
     - Total par matches course par
     - Total yardage matches course yardage

3. **Test Course Management Functions**
   - Try adding a new hole to a course
   - Verify hole appears in the table
   - Test deleting the test hole
   - Verify hole is removed

**Expected Results:**
- All courses have complete 18-hole configurations
- Hole data is accurate and complete
- Course management functions work properly

### Phase 3: Tournament Setup
**Test Duration: 25 minutes**

1. **Create Tournament**
   - Navigate to "Tournament Management"
   - Click "Create Tournament" 
   - Fill in tournament details:
     - Tournament name (e.g., "Spring Golf Weekend 2025")
     - Select golf course from dropdown
     - Set start date and end date
     - Set daily buy-in amount
     - Set overall buy-in amount
   - Submit and verify tournament is created

2. **Tournament Selection and Configuration**
   - In "Tournament Management", use the dropdown to select your newly created tournament
   - Verify tournament details display correctly in the overview section
   - Check that tournament status shows "Draft" initially
   - Review tournament information card shows correct dates, course, and buy-in amounts

3. **Tournament Status Management**
   - Test status transitions:
     - Tournament should start as "Draft"
     - Click "Start" to move to "In Progress"
     - Verify status updates and visual indicators change
   - Note: Tournament status controls workflow access

4. **Add Players to Tournament**
   - With tournament selected, navigate to player management
   - Add all players who will participate
   - Submit and verify players are added to the selected tournament
   - Check that player count matches expected participants

**Expected Results:**
- Tournament created and selectable from dropdown
- Tournament context clearly displayed throughout interface
- Status management works correctly with visual feedback
- All participating players registered for the specific tournament

### Phase 4: Round Setup
**Test Duration: 20 minutes**

1. **Create Tournament Rounds**
   - Ensure your tournament is selected in the dropdown
   - Verify the "Rounds for [Tournament Name]" section shows your tournament
   - Click "Add Round" for each day of the tournament
   - In the round creation dialog, verify:
     - Dialog title shows "Create New Round for [Tournament Name]"
     - Tournament field is pre-filled and disabled (shows context)
     - Tournament dates are displayed for reference
   - For each round:
     - Set round number (1, 2, 3, etc.)
     - Set date within tournament date range
     - Select course (should match tournament course)
   - Submit and verify rounds appear in the tournament-specific list

2. **Round Context Verification**
   - Verify round list shows "Rounds for [Tournament Name]" header
   - Check that only rounds for the selected tournament are displayed
   - Test switching tournament selection to see how round display changes
   - Confirm round creation is contextual to selected tournament

3. **Scorecard Setup**
   - For each round, create scorecards
   - Navigate to score entry to set up groups
   - Create scorecards with proper player assignments
   - Verify scorecard context matches tournament and round selection

**Expected Results:**
- Tournament context is clear throughout round creation process
- Round creation dialog shows which tournament the round belongs to
- Only relevant rounds display for the selected tournament
- Round management interface provides clear tournament identification

### Phase 5: Score Entry Testing
**Test Duration: 20 minutes**

1. **Score Entry Interface**
   - Navigate to "Score Entry"
   - Select active tournament
   - Select first round
   - Choose a scorecard to test

2. **Test Score Entry**
   - Enter test scores for one player on a few holes:
     - Use realistic scores (par, bogey, birdie)
     - Verify net scores calculate automatically
     - Test validation (scores should be reasonable)
   - Save scores and verify they persist

3. **Score Validation**
   - Try entering invalid scores (negative, too high)
   - Verify error messages appear
   - Ensure only valid scores are accepted

**Expected Results:**
- Score entry interface works smoothly
- Net scores calculate correctly based on handicaps
- Input validation prevents invalid entries
- Scores save and persist properly

### Phase 6: Leaderboard Testing
**Test Duration: 10 minutes**

1. **Leaderboard Display**
   - Navigate to "Leaderboard"
   - Verify tournament leaderboard appears
   - Check that test scores are reflected
   - Verify net score calculations

2. **Daily Results**
   - Switch to "Daily Results" view
   - Verify daily leaderboards show correctly
   - Check that each round has its own leaderboard

**Expected Results:**
- Leaderboards display correctly
- Net score calculations are accurate
- Daily and overall standings are properly separated

### Phase 7: Achievement System Testing
**Test Duration: 10 minutes**

1. **Achievement Verification**
   - Navigate to "Achievements"
   - Verify achievement badges are loaded
   - Check different achievement categories
   - Verify achievement descriptions are clear

2. **Achievement Tracking**
   - Review player achievement progress
   - Verify achievements align with entered scores
   - Check that achievement system is active

**Expected Results:**
- All achievements properly configured
- Achievement tracking works with score entry
- Achievement progress displays correctly

### Phase 8: Mobile Responsiveness
**Test Duration: 10 minutes**

1. **Mobile Interface Testing**
   - Access application on mobile device or resize browser
   - Verify bottom navigation appears on mobile
   - Test all major functions on mobile:
     - Score entry
     - Leaderboard viewing
     - Player information
   - Verify touch interactions work properly

**Expected Results:**
- Mobile interface is fully functional
- All critical features accessible on mobile
- Touch interactions work smoothly

### Phase 9: Data Integrity Check
**Test Duration: 10 minutes**

1. **Final Data Verification**
   - Review all tournament data one final time
   - Verify player handicaps are current and accurate
   - Check that course data matches the actual course
   - Confirm tournament dates and buy-in amounts
   - Verify all players are registered for the tournament

2. **Backup Considerations**
   - Document all tournament settings
   - Take screenshots of key configurations
   - Note any customizations or special rules

**Expected Results:**
- All data is accurate and complete
- Tournament is fully configured and ready
- System is prepared for live use

## Pre-Weekend Final Checklist

**24 Hours Before Tournament:**
- [ ] Tournament selected and status set to "In Progress"
- [ ] All players registered and handicaps confirmed
- [ ] Tournament dates and course verified in tournament overview
- [ ] All rounds created with proper tournament context
- [ ] Scorecards properly configured with player assignments
- [ ] Score entry system tested and working
- [ ] Leaderboards displaying correctly
- [ ] Mobile access confirmed for on-course use
- [ ] Admin credentials secured and accessible
- [ ] Tournament selection workflow tested and documented
- [ ] Player instructions communicated (if needed)

**Day of Tournament:**
- [ ] System accessible on-site
- [ ] Mobile devices charged and ready
- [ ] Backup admin access available
- [ ] Score entry workflow reviewed with designated scorekeepers
- [ ] Leaderboard display ready for group viewing

## Troubleshooting Common Issues

**Course Data Problems:**
- Verify all 18 holes are configured
- Check that handicap rankings are 1-18 with no duplicates
- Ensure par and yardage totals match course specifications

**Player Registration Issues:**
- Confirm handicap indexes are accurate
- Verify all players are added to the tournament
- Check that player names are spelled correctly

**Score Entry Problems:**
- Ensure scorecards are properly assigned to players
- Verify round status is set to "in_progress" for active scoring
- Check that hole data is complete for net score calculations

**Tournament Management Issues:**
- Confirm tournament is properly selected in dropdown
- Verify tournament context appears throughout interface
- Check that round creation shows correct tournament name
- Ensure status management workflow is understood
- Verify round list shows only rounds for selected tournament
- Test tournament switching to confirm context updates properly

**Leaderboard Display Issues:**
- Verify scores are saved and committed
- Check that tournament is properly selected
- Ensure net score calculations are working

## Success Criteria

The tournament setup is ready when:
- All players can be found in the system with correct handicaps
- All golf courses have complete 18-hole configurations
- Tournament is created with proper dates and buy-in amounts and selectable from dropdown
- Tournament context is clearly displayed throughout the interface
- All rounds are scheduled with proper tournament association and clear context
- Round creation dialog shows correct tournament information
- Score entry system works smoothly with automatic net score calculations
- Leaderboards display correctly with proper standings
- Mobile interface is fully functional for on-course use
- Achievement system is active and tracking properly
- Tournament selection workflow is intuitive and clearly documented

## Support Information

If issues arise during testing:
1. Check console logs for error messages
2. Verify database connectivity
3. Confirm all required data is populated
4. Test basic functionality first, then complex features
5. Document any issues for developer review

**Total Testing Time: ~2 hours**

This comprehensive testing ensures your golf tournament weekend will run smoothly with all systems properly configured and functional.