// Background script for the GoalKeeper Pet extension
// This script runs in the background and tracks tab changes

// API endpoint for checking URL productivity
const API_ENDPOINT = 'https://wildhacks-api.vercel.app/api/check-url';
// Default pet health
const MAX_HEALTH = 100;
// Health decrease amount for unproductive sites
const HEALTH_DECREASE = 5;
// Cooldown period in milliseconds to avoid too frequent checks
const CHECK_COOLDOWN = 10000; // 10 seconds

// Store the last check time to implement cooldown
let lastCheckTime = 0;

// Initialize pet data in storage if it doesn't exist
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['petHealth', 'petType', 'goals', 'userId'], (result) => {
    if (result.petHealth === undefined) {
      chrome.storage.local.set({ petHealth: MAX_HEALTH });
    }
    if (result.petType === undefined) {
      chrome.storage.local.set({ petType: 'dragon' }); // Default pet type
    }
    if (result.goals === undefined) {
      chrome.storage.local.set({ goals: [] }); // Empty goals array
    }
    if (result.userId === undefined) {
      chrome.storage.local.set({ userId: null }); // No user ID initially
    }
  });
});

// Listen for tab updates (when user navigates to a new page)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only check when the page has finished loading and has a URL
  if (changeInfo.status === 'complete' && tab.url) {
    checkURL(tab.url, tabId);
  }
});

// Listen for tab activation (when user switches tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      checkURL(tab.url, tab.id);
    }
  });
});

// Function to check if a URL is productive based on user goals
async function checkURL(url, tabId) {
  // Implement cooldown to avoid too frequent checks
  const now = Date.now();
  if (now - lastCheckTime < CHECK_COOLDOWN) {
    return;
  }
  lastCheckTime = now;

  // Skip checking for browser internal pages, extension pages, etc.
  if (url.startsWith('chrome://') || 
      url.startsWith('chrome-extension://') || 
      url.startsWith('about:') ||
      url.startsWith('file://')) {
    return;
  }

  try {
    // Get user ID and goals from storage
    const { userId, goals, petHealth } = await chrome.storage.local.get(['userId', 'goals', 'petHealth']);
    
    // If no user ID or goals, don't perform check
    if (!userId || !goals || goals.length === 0) {
      return;
    }

    // Prepare data for API request
    const data = {
      url: url,
      userId: userId,
      goals: goals
    };

    // Call the API to check if the URL is productive
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    // Update pet health based on productivity check
    if (!result.isProductive) {
      // Calculate new health
      const newHealth = Math.max(0, petHealth - HEALTH_DECREASE);
      
      // Update health in storage
      chrome.storage.local.set({ petHealth: newHealth });
      
      // Send message to content script to update pet display
      chrome.tabs.sendMessage(tabId, { 
        action: 'updatePet', 
        health: newHealth,
        isProductive: false,
        message: result.message || 'This site is not helping you reach your goals!'
      });
      
      // If health reaches 0, notify user
      if (newHealth === 0) {
        chrome.tabs.sendMessage(tabId, { 
          action: 'petDied',
          message: 'Your pet has run out of health! Focus on your goals to revive it.'
        });
      }
    } else {
      // Send message that site is productive
      chrome.tabs.sendMessage(tabId, { 
        action: 'updatePet', 
        health: petHealth,
        isProductive: true,
        message: result.message || 'This site is helping you reach your goals!'
      });
    }
  } catch (error) {
    console.error('Error checking URL productivity:', error);
  }
}

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle login from popup
  if (message.action === 'login') {
    chrome.storage.local.set({ 
      userId: message.userId,
      goals: message.goals,
      petType: message.petType || 'dragon',
      petHealth: MAX_HEALTH
    });
    sendResponse({ success: true });
  }
  
  // Handle logout from popup
  else if (message.action === 'logout') {
    chrome.storage.local.set({ 
      userId: null,
      goals: [],
      petHealth: MAX_HEALTH
    });
    sendResponse({ success: true });
  }
  
  // Handle request for pet data
  else if (message.action === 'getPetData') {
    chrome.storage.local.get(['petHealth', 'petType', 'userId', 'goals'], (result) => {
      sendResponse(result);
    });
    return true; // Required for async sendResponse
  }
  
  // Handle manual health update (for testing)
  else if (message.action === 'updateHealth') {
    chrome.storage.local.set({ petHealth: message.health });
    sendResponse({ success: true });
  }
});
