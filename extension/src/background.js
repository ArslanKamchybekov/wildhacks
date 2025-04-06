// background.js - Handles logic for personal pet CV interaction

const LOCAL_CV_SERVER = 'http://localhost:8000/api/state';
const DUCK_GIFS = {
  IDLE: 'duckidle.gif',
  HAPPY: 'duckhappy.gif',
  DAMAGE: 'duckdamage.gif',
  CRITICAL: 'duckcritical.gif',
  DEATH: 'duckdeath.gif',
  THUMB: 'duckthumb.gif',
  WAVE: 'duckwave.gif'
};

// Keep track of pet state
let currentDuckGif = DUCK_GIFS.IDLE;
let isDuckDead = false;
let personalPetHealth = 100;
let isDamageAnimationActive = false;
let lastHealthUpdate = 0;
const HEALTH_UPDATE_INTERVAL = 3000;

// WAVE DETECTION IMPROVEMENT
const WAVE_MEMORY_DURATION = 3000; // Remember waves for 3 seconds
let lastWaveDetectedTime = 0;

// Add this near the top with your other state variables
let isDeathAnimationPlaying = false;

// Debug mode to see detailed logs
const DEBUG = true;
function log(...args) {
  if (DEBUG) console.log(...args);
}

function pollCvData() {
  fetch(LOCAL_CV_SERVER)
    .then(res => res.json())
    .then(data => {
      // WAVE DETECTION IMPROVEMENT - Remember when we see a wave
      if (data.wave === 'detected') {
        lastWaveDetectedTime = Date.now();
        log("Wave detected! Will remember for 3 seconds");
      }
      
      // Create enhanced data with better wave detection
      const enhancedData = {
        ...data,
        // Override wave detection if we've seen a wave in the last 3 seconds
        wave: (Date.now() - lastWaveDetectedTime < WAVE_MEMORY_DURATION) 
              ? 'detected' : data.wave
      };
      
      processCvState(enhancedData);
    })
    .catch(() => {
      log("Error connecting to CV server");
    });
}

// 2. Update the processCvState function to completely stop processing when dead
function processCvState(data) {
  // Completely block all updates if the duck is dead
  if (isDuckDead) {
    // Only log if still in animation
    if (isDeathAnimationPlaying) {
      log("Death animation in progress. Blocking all updates.");
    }
    
    // Force death GIF to stay as current GIF
    currentDuckGif = DUCK_GIFS.DEATH;
    
    // Skip all other processing
    return;
  }

  const now = Date.now();
  const isFocused = data.focus === 'focused';
  const isHappy = data.emotion === 'happy';
  const wave = data.wave === 'detected';
  const thumbsUp = data.thumbs_up === 'detected';

  log("Processing CV data:", { 
    focus: data.focus, 
    emotion: data.emotion,
    wave: data.wave,
    thumbsUp: data.thumbs_up
  });

  let healthChange = 0;
  let newGif = DUCK_GIFS.IDLE;

  // Handle death state but don't return early if animation is playing
  if (isDuckDead) {
    newGif = DUCK_GIFS.DEATH;
  } 
  // Calculate health changes if not dead
  else {
    // Simply calculate health changes
    if (!isFocused) {
      healthChange = -10;
      newGif = DUCK_GIFS.DAMAGE;
    } else if (isFocused && isHappy) {
      healthChange = 3;
      newGif = DUCK_GIFS.HAPPY;
    } else if (isFocused) {
      healthChange = 1;
      newGif = DUCK_GIFS.IDLE;
    }

    // Critical health overrides regular states
    if (personalPetHealth < 50 && healthChange >= 0) {
      newGif = DUCK_GIFS.CRITICAL;
    }

    // FIXED: Wave always takes priority over thumbs up
    if (wave) {
      log("Wave detected - selecting wave animation");
      newGif = DUCK_GIFS.WAVE;
    } else if (thumbsUp) {
      log("Thumbs up detected - selecting thumbs up animation");
      newGif = DUCK_GIFS.THUMB;
    }

    // ✅ Apply health changes ONLY if interval has passed
    if (now - lastHealthUpdate >= HEALTH_UPDATE_INTERVAL) {
      personalPetHealth = Math.max(0, Math.min(100, personalPetHealth + healthChange));
      lastHealthUpdate = now;
      log("Health updated to:", personalPetHealth);

      // ✅ If we just applied DAMAGE, trigger damage animation
      if (healthChange < 0) {
        // Always send damage notification when health decreases
        log("Sending damage animation to all tabs");
        
        // Set the flag first
        isDamageAnimationActive = true;
        
        // Notify all tabs
        chrome.tabs.query({}, (tabs) => {
          for (let tab of tabs) {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'showDamage',
              health: personalPetHealth // Include current health for reference
            });
          }
        });
      }
    }

    // Handle pet death - add code to make sure it stays dead
    if (personalPetHealth <= 0 && !isDuckDead) {
      isDuckDead = true;
      isDeathAnimationPlaying = true;
      currentDuckGif = DUCK_GIFS.DEATH;
      log("Pet has died :( Showing death animation");

      // Notify all tabs of death (and show death gif)
      chrome.tabs.query({}, (tabs) => {
        for (let tab of tabs) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'petDied',
            deathGifPath: chrome.runtime.getURL(`assets/${DUCK_GIFS.DEATH}`)
          });
        }
      });

      // Match this timeout to content-script.js exactly
      setTimeout(() => {
        isDeathAnimationPlaying = false;
        log("Death animation duration complete");
      }, 12000); // Use 12000ms to match content-script.js
    }
  }

  // ✅ Always update the current duck GIF
  currentDuckGif = newGif;
  log("Selected duck GIF:", currentDuckGif);

  // Notify popup
  chrome.runtime.sendMessage({
    action: 'updateDuckGif',
    gifPath: chrome.runtime.getURL(`assets/${currentDuckGif}`),
    isDead: isDuckDead
  });

  // Notify all tabs - FIXED: Always include full cvData
  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updatePet',
        health: personalPetHealth,
        cvData: data,
        isDead: isDuckDead
      });
    }
  });
}

// 1. First, reduce the polling frequency
function startCvPolling() {
  log("Starting CV polling");
  setInterval(pollCvData, 300); // Reduce from 100ms to 300ms - still responsive but less CPU usage
  pollCvData();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  log("Background received message:", message);
  
  // Add a new message type for resetting
  if (message.action === 'resetPet') {
    isDuckDead = false;
    isDeathAnimationPlaying = false; // Reset this flag too
    personalPetHealth = 100;
    currentDuckGif = DUCK_GIFS.IDLE;
    isDamageAnimationActive = false;
    log("Pet has been resurrected!");
    sendResponse({ success: true });
    
    // Notify tabs of resurrection
    chrome.tabs.query({}, (tabs) => {
      for (let tab of tabs) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updatePet',
          health: personalPetHealth,
          cvData: {
            focus: 'focused',
            emotion: 'neutral',
            wave: 'not_detected',
            thumbs_up: 'not_detected'
          },
          isDead: false
        });
      }
    });
    
    return true;
  }
  
  if (message.action === 'damageAnimationComplete') {
    isDamageAnimationActive = false;
    sendResponse({ success: true });
  } else if (message.action === 'getPetData') {
    // FIXED: Include latest CV data
    sendResponse({
      petHealth: personalPetHealth,
      cvData: {
        focus: 'focused',
        emotion: 'neutral',
        wave: (Date.now() - lastWaveDetectedTime < WAVE_MEMORY_DURATION) ? 'detected' : 'not_detected',
        thumbs_up: 'not_detected'
      },
      isDead: isDuckDead
    });
  } else if (message.action === 'getDuckGif') {
    sendResponse({
      success: true,
      gifPath: chrome.runtime.getURL(`assets/${currentDuckGif}`),
      isDead: isDuckDead
    });
  }
  return true;
});

// TEST USER (reinserted)
chrome.storage.local.set({
  userEmail: 'arslankamcybekov7@gmail.com',
  isLoggedIn: true
});

startCvPolling();