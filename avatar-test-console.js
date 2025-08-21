// Browser Console Test for Avatar Rendering
// Paste this into the browser console on the virtual office page

console.log('🧪 Starting Avatar Rendering Test for leon and anna...');

// Function to check if MainScene is ready
function checkMainSceneReady() {
  const game = window.game || window.phaserGame;
  if (!game) {
    console.log('❌ No Phaser game instance found');
    return null;
  }
  
  const scene = game.scene.getScene('MainScene');
  if (!scene) {
    console.log('❌ MainScene not found');
    return null;
  }
  
  console.log('✅ MainScene found:', scene);
  return scene;
}

// Function to check for specific users (leon and anna)
function checkSpecificUsers() {
  const scene = checkMainSceneReady();
  if (!scene) return { found: false, users: [] };
  
  const otherPlayers = scene.getOtherPlayers?.();
  const foundUsers = [];
  
  console.log('👥 Checking for leon and anna avatars...');
  console.log('👥 Total other players:', otherPlayers?.size || 0);
  
  if (otherPlayers && otherPlayers.size > 0) {
    otherPlayers.forEach((player, id) => {
      console.log(`🔍 Player ${id}: name="${player.name}", sprite=${!!player.sprite}`);
      
      // Check if the player name matches leon or anna (case insensitive)
      const nameToCheck = player.name.toLowerCase();
      if (nameToCheck.includes('leon') || nameToCheck.includes('anna')) {
        foundUsers.push({
          id: id,
          name: player.name,
          hasSprite: !!player.sprite,
          position: { x: player.x, y: player.y }
        });
        console.log(`✅ Found target user: ${player.name}`);
      }
    });
  }
  
  return {
    found: foundUsers.length > 0,
    users: foundUsers,
    totalPlayers: otherPlayers?.size || 0
  };
}

// Function to check online users count from Redux store
function checkOnlineUsersCount() {
  try {
    // Try to get Redux store from window
    const store = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || window.store;
    if (store && typeof store.getState === 'function') {
      const state = store.getState();
      const onlineUsers = state.user?.onlineUsers || [];
      console.log('📊 Redux online users:', onlineUsers.length);
      console.log('📋 Online users list:', onlineUsers.map(u => u.username || u.id));
      return onlineUsers.length;
    }
  } catch (error) {
    console.log('⚠️ Could not access Redux store:', error.message);
  }
  
  // Fallback: Check from DOM
  const onlineCountElements = document.querySelectorAll('*');
  for (let element of onlineCountElements) {
    if (element.textContent && element.textContent.includes('在线用户')) {
      const match = element.textContent.match(/在线用户:?\s*(\d+)/);
      if (match) {
        console.log('📊 DOM online users count:', match[1]);
        return parseInt(match[1]);
      }
    }
  }
  
  return 0;
}

// Function to test avatar rendering
function testAvatarRendering() {
  const scene = checkMainSceneReady();
  if (!scene) return { success: false, error: 'Scene not found' };
  
  console.log('🔍 Scene ready state:', scene.sceneReady || scene.isReady?.());
  console.log('🔍 Scene.add available:', !!scene.add);
  console.log('🔍 AvatarGenerator available:', !!scene.avatarGenerator);
  
  // Check current player
  const currentPlayer = scene.getCurrentPlayer?.();
  console.log('👤 Current player exists:', !!currentPlayer);
  
  const specificUsers = checkSpecificUsers();
  const onlineCount = checkOnlineUsersCount();
  
  return {
    success: true,
    sceneReady: scene.sceneReady || scene.isReady?.(),
    addAvailable: !!scene.add,
    avatarGenerator: !!scene.avatarGenerator,
    currentPlayer: !!currentPlayer,
    specificUsers: specificUsers,
    onlineUsersCount: onlineCount,
    totalPlayersInScene: specificUsers.totalPlayers
  };
}

// Run the comprehensive test
console.log('🔍 Running comprehensive avatar test...');
const results = testAvatarRendering();
console.log('📊 Test Results:', results);

if (results.success) {
  console.log('🎯 Target Users Check:');
  console.log(`   - Found leon or anna: ${results.specificUsers.found}`);
  console.log(`   - Found users: ${results.specificUsers.users.length}`);
  
  results.specificUsers.users.forEach(user => {
    console.log(`     • ${user.name} (${user.id}): sprite=${user.hasSprite}, pos=${user.position.x},${user.position.y}`);
  });
  
  console.log(`📊 User Counts Comparison:`);
  console.log(`   - Online users (from state): ${results.onlineUsersCount}`);
  console.log(`   - Players in scene: ${results.totalPlayersInScene}`);
  
  if (results.onlineUsersCount !== results.totalPlayersInScene) {
    console.warn('⚠️ User count mismatch detected!');
    console.log('💡 This might indicate a sync issue between server state and game scene.');
  }
  
  // Check if both leon and anna are present (if we expect both)
  const hasLeon = results.specificUsers.users.some(u => u.name.toLowerCase().includes('leon'));
  const hasAnna = results.specificUsers.users.some(u => u.name.toLowerCase().includes('anna'));
  
  console.log(`🎯 Expected Users Status:`);
  console.log(`   - Leon present: ${hasLeon}`);
  console.log(`   - Anna present: ${hasAnna}`);
  
  if (hasLeon && hasAnna) {
    console.log('✅ SUCCESS: Both leon and anna avatars are present!');
  } else if (hasLeon || hasAnna) {
    console.log('⚠️ PARTIAL: Only one of leon/anna is present');
  } else {
    console.log('❌ FAILURE: Neither leon nor anna avatars found');
    console.log('💡 Check if users are logged in with correct usernames');
  }
} else {
  console.log('❌ Test failed:', results.error);
}

console.log('🔍 Avatar detection test complete. Check the results above.');
console.log('💡 Make sure both users are logged in as "leon" and "anna" respectively.');