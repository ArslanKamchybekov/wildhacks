// content-script.js - Handles duck animation updates and damage effect

let lastGifPath = "";
let petElement = null;
let lastHealth = 100;
let damageTimeout = null;
let isDeathAnimationPlaying = false; // NEW: Death animation state

// Check if we should initialize the pet on this page
function shouldInitializePet() {
  // Get current URL
  const currentUrl = window.location.href;
  
  // Don't initialize on local development sites
  if (currentUrl.includes('localhost') || 
      currentUrl.includes('127.0.0.1') ||
      currentUrl.startsWith('file:///')) {
    console.log("Not initializing pet on local/development page:", currentUrl);
    return false;
  }
  
  // Don't initialize on certain sites where it might cause issues
  const blockedDomains = [
    'meet.google.com',
    'zoom.us',
    'teams.microsoft.com',
    'youtube.com/watch'
  ];
  
  if (blockedDomains.some(domain => currentUrl.includes(domain))) {
    console.log("Not initializing pet on blocked domain:", currentUrl);
    return false;
  }
  
  return true;
}

// Create pet element if needed
function initializePet() {
  // First check if we should initialize on this page
  if (!shouldInitializePet()) {
    return;
  }
  
  // Continue with existing initialization code
  if (document.getElementById('goalkeeper-pet')) {
    petElement = document.getElementById('goalkeeper-pet');
    return;
  }
  
  // Create pet container
  petElement = document.createElement('div');
  petElement.id = 'goalkeeper-pet';
  petElement.className = 'goalkeeper-pet';
  
  // Create health bar container
  const healthBarContainer = document.createElement('div');
  healthBarContainer.className = 'goalkeeper-health-container';
  
  // Create actual health bar
  const healthBar = document.createElement('div');
  healthBar.id = 'goalkeeper-health-bar';
  healthBar.className = 'goalkeeper-health-bar';
  healthBar.style.width = '100%';
  
  // Create pet image
  const petImg = document.createElement('img');
  petImg.id = 'goalkeeper-pet-img';
  petImg.src = chrome.runtime.getURL('assets/duckidle.gif');
  petImg.alt = 'Study Buddy';
  
  // Assemble elements
  healthBarContainer.appendChild(healthBar);
  petElement.appendChild(healthBarContainer);
  petElement.appendChild(petImg);
  
  // Add to page
  document.body.appendChild(petElement);
  
  console.log("Pet initialized on page");
}

// Show damage animation on the pet
function showDamageAnimation() {
  console.log("Showing damage animation");
  
  // Don't block damage animation if already running - just restart it
  if (isDeathAnimationPlaying) return; // Only check for death
  
  // Clear existing timeout if there is one
  if (damageTimeout) {
    clearTimeout(damageTimeout);
    petElement.classList.remove("damage-shake");
  }
  
  const petImg = document.getElementById("goalkeeper-pet-img");
  if (!petImg || !petElement) return;

  // Store the current GIF to return to
  const originalSrc = petImg.src;
  
  // Always show damage animation
  petImg.src = chrome.runtime.getURL("assets/duckdamage.gif");
  petElement.classList.add("damage-shake");
  console.log("🔴 DAMAGE ANIMATION STARTED");

  // Set timeout to revert after animation
  damageTimeout = setTimeout(() => {
    petElement.classList.remove("damage-shake");
    chrome.runtime.sendMessage({ action: "damageAnimationComplete" });
    petImg.src = originalSrc;
    damageTimeout = null;
    console.log("🟢 DAMAGE ANIMATION COMPLETED");
  }, 1000);
}

// Improved death animation function
function playDeathAnimation(deathGifPath) {
  console.log("Starting death animation with precise timing");
  
  // Set this flag to prevent any other animations
  isDeathAnimationPlaying = true;
  
  // Make sure pet is visible during death animation
  if (petElement) {
    petElement.style.display = 'flex';
  }

  const petImg = document.getElementById("goalkeeper-pet-img");
  if (!petImg) return;

  // Force health bar to zero
  const healthBar = document.getElementById('goalkeeper-health-bar');
  if (healthBar) {
    healthBar.style.width = '0%';
    healthBar.style.backgroundColor = '#F44336'; // Red
  }

  // Clear any existing animation timeouts to prevent conflicts
  if (damageTimeout) {
    clearTimeout(damageTimeout);
    damageTimeout = null;
  }
  
  // Force a fresh load of the GIF by adding a cache-busting parameter
  const cacheBustPath = deathGifPath + '?t=' + Date.now();
  petImg.src = cacheBustPath;
  lastGifPath = deathGifPath;
  
  // Fallback in case the path is wrong
  petImg.onerror = function() {
    const fallbackPath = chrome.runtime.getURL('assets/duckdeath.gif');
    petImg.src = fallbackPath + '?t=' + Date.now();
    lastGifPath = fallbackPath;
  };
  
  // Mark animation as complete after exact GIF duration
  setTimeout(() => {
    isDeathAnimationPlaying = false;
    console.log("Death animation completed");
  }, 12000); // Slightly longer than 11.44s to ensure full play
}

// Update the pet display function to preserve the death animation
function updatePetDisplay(health, cvData, isDead) {
  if (!petElement) {
    initializePet();
  }
  
  // For dead state, show death animation but don't replace if already showing
  if (isDead) {
    petElement.style.display = 'flex';
    const petImg = document.getElementById('goalkeeper-pet-img');
    
    // Only set the death image if it's not already showing a death-related image
    if (petImg && !petImg.src.includes('duckdeath.gif')) {
      petImg.src = chrome.runtime.getURL('assets/duckdeath.gif');
    }
    return;
  }
  
  // Next priority: death animation in progress
  if (isDeathAnimationPlaying) {
    // Don't change anything during death animation
    return;
  }
  
  // Make sure pet is visible (in case it was hidden)
  petElement.style.display = 'flex';
  
  console.log("Updating pet display:", { health, cvData });
  
  // Don't update if damage animation is active
  if (damageTimeout) {
    console.log("Damage animation active, skipping update");
    return;
  }
  
  // Handle death state
  if (health <= 0) {
    const petImg = document.getElementById('goalkeeper-pet-img');
    if (petImg) {
      petImg.src = chrome.runtime.getURL('assets/duckdeath.gif');
    }
    return;
  }
  
  // Update health bar
  const healthBar = document.getElementById('goalkeeper-health-bar');
  if (healthBar) {
    healthBar.style.width = `${health}%`;
    
    // Change color based on health level
    if (health > 70) {
      healthBar.style.backgroundColor = '#4CAF50'; // Green
    } else if (health > 50) {
      healthBar.style.backgroundColor = '#FFC107'; // Yellow
    } else {
      healthBar.style.backgroundColor = '#F44336'; // Red
    }
  }
  
  // Handle missing data
  if (!cvData) {
    console.error("Missing CV data");
    cvData = {
      focus: 'focused',
      emotion: 'neutral',
      wave: 'not_detected',
      thumbs_up: 'not_detected'
    };
  }
  
  // Update duck image
  const petImg = document.getElementById('goalkeeper-pet-img');
  if (!petImg) return;
  
  let newGifPath = "";
  
  // Determine which GIF to show by priority
  if (health <= 0) {
    newGifPath = chrome.runtime.getURL('assets/duckdeath.gif');
    console.log("DEAD: Showing death duck");
  } else if (health < 50) {
    newGifPath = chrome.runtime.getURL('assets/duckcritical.gif');
    console.log("CRITICAL: Showing critical duck");
  } else if (cvData.wave === 'detected') {
    newGifPath = chrome.runtime.getURL('assets/duckwave.gif');
    console.log("WAVE: Showing wave duck");
  } else if (cvData.thumbs_up === 'detected') {
    newGifPath = chrome.runtime.getURL('assets/duckthumb.gif');
    console.log("THUMBS UP: Showing thumbs up duck");
  } else if (cvData.focus === 'focused') {
    if (cvData.emotion === 'happy') {
      newGifPath = chrome.runtime.getURL('assets/duckhappy.gif');
      console.log("HAPPY: Showing happy duck");
    } else {
      newGifPath = chrome.runtime.getURL('assets/duckidle.gif');
      console.log("IDLE: Showing idle duck");
    }
  } else {
    newGifPath = chrome.runtime.getURL('assets/duckidle.gif');
    console.log("DEFAULT: Showing idle duck");
  }
  
  // Only update if different
  if (newGifPath && newGifPath !== lastGifPath) {
    petImg.src = newGifPath;
    lastGifPath = newGifPath;
    console.log("Updated duck image to:", newGifPath);
  }
}

// Initialize on load
initializePet();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message);
  
  if (message.action === "showDamage") {
    console.log("📣 SHOW DAMAGE EVENT RECEIVED");
    showDamageAnimation();
    sendResponse({ success: true });
  } 
  
  // Use consistent naming - handle both updatePet and updatePetOnly
  else if (message.action === "updatePet" || message.action === "updatePetOnly") {
    updatePetDisplay(message.health, message.cvData, message.isDead);
    sendResponse({ success: true });
  }
  
  // Handle direct GIF updates from popup
  else if (message.action === "updateDuckGif") {
    const petImg = document.getElementById("goalkeeper-pet-img");
    if (petImg && message.gifPath) {
      petImg.src = message.gifPath;
      lastGifPath = message.gifPath;
      console.log("Updated duck image directly to:", message.gifPath);
    }
    sendResponse({ success: true });
  }
  
  // Special handler for pet death
  else if (message.action === 'petDied') {
    // Only play the death animation if it's not already playing
    if (!isDeathAnimationPlaying) {
      playDeathAnimation(message.deathGifPath);
    } else {
      console.log("Death animation already in progress, ignoring duplicate request");
    }
    sendResponse({ success: true });
    return true;
  }
  
  return true;
});

// Initialize CSS styles
const style = document.createElement('style');
style.textContent = `
  .goalkeeper-pet {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .goalkeeper-pet img {
    width: 100px;
    height: 100px;
  }
  
  .goalkeeper-health-container {
    width: 80px;
    height: 8px;
    background-color: #444;
    border-radius: 4px;
    margin-bottom: 5px;
  }
  
  .goalkeeper-health-bar {
    height: 100%;
    background-color: #4CAF50;
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  
  .damage-shake {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
  }
  
  @keyframes shake {
    10%, 90% { transform: translate3d(-1px, 0, 0); }
    20%, 80% { transform: translate3d(2px, 0, 0); }
    30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
    40%, 60% { transform: translate3d(3px, 0, 0); }
  }
  
  .bounce {
    animation: bounce 2s infinite;
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
    40% {transform: translateY(-10px);}
    60% {transform: translateY(-5px);}
  }
`;
document.head.appendChild(style);
