// Content script for the GoalKeeper Pet extension
// This script is injected into web pages and handles displaying the pet

// Create and insert the pet element
let petElement = null;
let notificationElement = null;

// Initialize the pet when the content script loads
function initializePet() {
  // Check if pet already exists
  if (document.getElementById('goalkeeper-pet')) {
    return;
  }

  // Create pet container
  petElement = document.createElement('div');
  petElement.id = 'goalkeeper-pet';
  petElement.className = 'goalkeeper-pet';
  
  // Create pet image
  const petImg = document.createElement('img');
  petImg.id = 'goalkeeper-pet-img';
  petImg.src = chrome.runtime.getURL('assets/duckidle.gif');
  petElement.appendChild(petImg);
  
  // Create health bar container
  const healthBarContainer = document.createElement('div');
  healthBarContainer.className = 'goalkeeper-health-container';
  
  // Create health bar
  const healthBar = document.createElement('div');
  healthBar.id = 'goalkeeper-health-bar';
  healthBar.className = 'goalkeeper-health-bar';
  healthBar.style.width = '100%';
  
  healthBarContainer.appendChild(healthBar);
  petElement.appendChild(healthBarContainer);
  
  // Create notification element
  notificationElement = document.createElement('div');
  notificationElement.id = 'goalkeeper-notification';
  notificationElement.className = 'goalkeeper-notification hidden';
  
  // Add elements to the page
  document.body.appendChild(petElement);
  document.body.appendChild(notificationElement);
  
  // Get initial pet data
  chrome.runtime.sendMessage({ action: 'getPetData' }, (response) => {
    if (response && response.petHealth !== undefined) {
      updatePetDisplay(response.petHealth);
    }
  });
}

// Update the pet display based on health
function updatePetDisplay(health) {
  if (!petElement) return;
  
  const healthBar = document.getElementById('goalkeeper-health-bar');
  if (healthBar) {
    healthBar.style.width = `${health}%`;
    
    // Change color based on health level
    if (health > 70) {
      healthBar.style.backgroundColor = '#4CAF50'; // Green
    } else if (health > 30) {
      healthBar.style.backgroundColor = '#FFC107'; // Yellow
    } else {
      healthBar.style.backgroundColor = '#F44336'; // Red
    }
  }
  
  // Update pet image based on health
  const petImg = document.getElementById('goalkeeper-pet-img');
  console.log(petImg);
  console.log(health)
  if (petImg) {
    if (health > 70) {
      petImg.src = chrome.runtime.getURL('assets/duckidle.gif');
    } else if (health > 30) {
      petImg.src = chrome.runtime.getURL('assets/duckdamage.gif');
    } else if (health > 0) {
      petImg.src = chrome.runtime.getURL('assets/duckcritical.gif');
    } else {
      petImg.src = chrome.runtime.getURL('assets/duckdeath.gif');
    }
  }
}

// Show notification with message
function showNotification(message, isProductive) {
  if (!notificationElement) return;
  
  notificationElement.textContent = message;
  notificationElement.className = `goalkeeper-notification ${isProductive ? 'productive' : 'unproductive'}`;
  
  // Show notification
  notificationElement.classList.remove('hidden');
  
  // Hide after 5 seconds
  setTimeout(() => {
    notificationElement.classList.add('hidden');
  }, 5000);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Initialize pet if not already done
  if (!petElement) {
    initializePet();
  }
  
  // Update pet based on productivity check
  if (message.action === 'updatePet') {
    updatePetDisplay(message.health);
    showNotification(message.message, message.isProductive);
  }
  
  // Handle pet death
  else if (message.action === 'petDied') {
    updatePetDisplay(0);
    showNotification(message.message, false);
  }
});

// Initialize pet when the page loads
window.addEventListener('load', initializePet);