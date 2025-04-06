// Background script for the GoalKeeper Pet extension
// This script runs in the background and tracks tab changes

// API endpoint for sending roasts
const ROAST_ENDPOINT = 'http://localhost:3000/api/cv-event';

// Duck GIF paths based on CV data
const DUCK_GIFS = {
  IDLE: 'duckidle.gif',
  HAPPY: 'duckhappy.gif',
  DAMAGE: 'duckdamage.gif',
  CRITICAL: 'duckcritical.gif',
  DEATH: 'duckdeath.gif',
  THUMB: 'duckthumb.gif',
  WAVE: 'duckwave.gif'
};

// Current duck state
let currentDuckGif = DUCK_GIFS.IDLE;

// Debug mode - set to true to see detailed logs
const DEBUG = true;

// Helper function for logging
function debugLog(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

// Cooldown for URL checks (in milliseconds)
const CHECK_COOLDOWN = 5000; // 5 seconds
let lastCheckTime = 0;

// Tab monitoring state
let isMonitoring = false;
let activeTabId = null;

// Start monitoring tabs
function startTabMonitoring() {
  if (isMonitoring) return;
  
  isMonitoring = true;
  
  // Add tab update listener
  chrome.tabs.onActivated.addListener(handleTabActivated);
  chrome.tabs.onUpdated.addListener(handleTabUpdated);
  
  // Check current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const tab = tabs[0];
      activeTabId = tab.id;
      processTabChange(tab.url, tab.id);
    }
  });
  
  console.log('Tab monitoring started');
}

// Stop monitoring tabs
function stopTabMonitoring() {
  if (!isMonitoring) return;
  
  isMonitoring = false;
  
  // Remove tab update listeners
  chrome.tabs.onActivated.removeListener(handleTabActivated);
  chrome.tabs.onUpdated.removeListener(handleTabUpdated);
  
  console.log('Tab monitoring stopped');
}

// Handle tab activated event
function handleTabActivated(activeInfo) {
  activeTabId = activeInfo.tabId;
  
  chrome.tabs.get(activeTabId, (tab) => {
    processTabChange(tab.url, tab.id);
  });
}

// Handle tab updated event
function handleTabUpdated(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tabId === activeTabId) {
    processTabChange(tab.url, tabId);
  }
}

// Process tab change and send data to API
async function processTabChange(url, tabId) {
  // Implement cooldown to avoid too frequent checks
  const now = Date.now();
  if (now - lastCheckTime < CHECK_COOLDOWN) {
    return;
  }
  lastCheckTime = now;
  
  debugLog('Processing URL:', url);
  
  // Skip browser internal pages
  if (!url || 
      url.startsWith('chrome://') || 
      url.startsWith('chrome-extension://') || 
      url.startsWith('about:') || 
      url.startsWith('file://')) {
    debugLog('Skipping browser internal URL:', url);
    return;
  }
  
  // Skip localhost URLs but log them
  if (url.includes('localhost')) {
    debugLog('Skipping localhost URL:', url);
    return;
  }
  
  // At this point, we have a valid external URL to process
  debugLog('Valid external URL detected:', url);
  
  try {
    // Get user email from storage
    const userEmail = await getUserEmail();
    console.log('Processing tab change for user email:', userEmail);
    
    // If no user email, don't perform check
    if (!userEmail) {
      console.log('No user email found, skipping API call');
      return;
    }

    // Send data to the server for non-localhost URLs
    try {
      debugLog('Sending data for URL:', url, 'to endpoint:', ROAST_ENDPOINT);
      
      // Create the payload
      const payload = {
        emotion: 'not_detected',
        focus: 'distracted',
        thumbs_up: 'not_detected',
        wave: 'not_detected',
        timestamp: new Date().toISOString(),
        user_email: userEmail,
        current_tab_url: url
      };
      debugLog('Request payload:', JSON.stringify(payload));
      
      // Make the API call with proper error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(ROAST_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
      
        if (response.ok) {
          const data = await response.json();
          updateDuckGif(data);
          debugLog('Data sent successfully:', data);
        } else {
          console.error('Failed to send data:', await response.text());
        }
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          console.error('Request timed out after 10 seconds');
        } else {
          console.error('Error sending data:', fetchError.message);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error('Error in processTabChange:', error.message);
    }
  } catch (error) {
    console.error('Error processing tab change:', error);
  }
}

// Helper function to get user email from storage
async function getUserEmail() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['userEmail'], (result) => {
      resolve(result.userEmail || null);
    });
  });
}

// Function to update duck GIF based on CV data
function updateDuckGif(data) {
  let newGif = DUCK_GIFS.IDLE; // Default
  
  // Check for gestures first
  if (data.wave === 'detected') {
    newGif = DUCK_GIFS.WAVE;
  } else if (data.thumbs_up === 'detected') {
    newGif = DUCK_GIFS.THUMB;
  }
  // Then check focus and emotion
  else if (data.focus === 'distracted') {
    if (data.emotion === 'angry' || data.emotion === 'disgust') {
      newGif = DUCK_GIFS.CRITICAL;
    } else if (data.emotion === 'sad' || data.emotion === 'fear') {
      newGif = DUCK_GIFS.DAMAGE;
    } else {
      newGif = DUCK_GIFS.DAMAGE; // Default for distracted
    }
  } else if (data.focus === 'not_detected') {
    newGif = DUCK_GIFS.DEATH; // User not detected
  } else if (data.emotion === 'happy' || data.emotion === 'surprise') {
    newGif = DUCK_GIFS.HAPPY;
  }
  
  // Only update if changed
  if (newGif !== currentDuckGif) {
    currentDuckGif = newGif;
    // Send message to popup to update the duck GIF
    chrome.runtime.sendMessage({
      action: 'updateDuckGif',
      gifPath: chrome.runtime.getURL(`../assets/${currentDuckGif}`)
    });
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  // Handle request for current duck GIF
  if (message.action === 'getDuckGif') {
    sendResponse({
      success: true,
      gifPath: chrome.runtime.getURL(`../assets/${currentDuckGif}`)
    });
    return true;
  }
  
  if (message.action === 'login') {
    // Store user email
    chrome.storage.local.set({
      userEmail: message.userEmail,
      isLoggedIn: true
    }, function() {
      console.log('User email saved to storage:', message.userEmail);
    });
    
    // Start monitoring tabs
    startTabMonitoring();
    
    sendResponse({success: true, message: 'User logged in successfully'});
    return true;
  } else if (message.action === 'logout') {
    // Clear user info
    chrome.storage.local.set({
      isLoggedIn: false,
      userEmail: null
    });
    
    console.log('User logged out');
    
    // Stop monitoring tabs
    stopTabMonitoring();
    
    sendResponse({success: true, message: 'User logged out successfully'});
    return true;
  }
});
