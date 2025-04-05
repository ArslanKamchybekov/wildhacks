// Popup JavaScript for the GoalKeeper Pet extension

// DOM elements
const loginSection = document.getElementById('login-section');
const petSection = document.getElementById('pet-section');
const settingsSection = document.getElementById('settings-section');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const petImage = document.getElementById('pet-image');
const healthValue = document.getElementById('health-value');
const healthBar = document.getElementById('health-bar');
const productiveCount = document.getElementById('productive-count');
const unproductiveCount = document.getElementById('unproductive-count');
const goalsList = document.getElementById('goals-list');
const settingsBtn = document.getElementById('settings-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const backBtn = document.getElementById('back-btn');
const petTypeSelect = document.getElementById('pet-type');
const notificationToggle = document.getElementById('notification-toggle');
const signupLink = document.getElementById('signup-link');

// API endpoint for authentication
const AUTH_API_ENDPOINT = 'https://wildhacks.vercel.app/api/auth';
const USER_API_ENDPOINT = 'https://wildhacks.vercel.app/api/user';

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is logged in
  chrome.storage.local.get(['userId', 'petHealth', 'petType', 'goals', 'productiveCount', 'unproductiveCount'], (result) => {
    if (result.userId) {
      // User is logged in, show pet section
      loginSection.classList.add('hidden');
      petSection.classList.remove('hidden');
      
      // Update pet display
      updatePetDisplay(result.petHealth || 100);
      
      // Update stats
      productiveCount.textContent = result.productiveCount || 0;
      unproductiveCount.textContent = result.unproductiveCount || 0;
      
      // Update goals list
      if (result.goals && result.goals.length > 0) {
        populateGoalsList(result.goals);
      } else {
        goalsList.innerHTML = '<li>No goals set. Add goals in the main app.</li>';
      }
      
      // Set pet type in settings
      if (result.petType) {
        petTypeSelect.value = result.petType;
      }
    }
  });
  
  // Add event listeners
  loginBtn.addEventListener('click', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  settingsBtn.addEventListener('click', showSettings);
  saveSettingsBtn.addEventListener('click', saveSettings);
  backBtn.addEventListener('click', hideSettings);
  signupLink.addEventListener('click', openSignupPage);
});

// Handle login
async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  if (!email || !password) {
    showError('Please enter both email and password');
    return;
  }
  
  try {
    // Call authentication API
    const response = await fetch(`${AUTH_API_ENDPOINT}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showError(data.message || 'Login failed');
      return;
    }
    
    // Get user data
    const userResponse = await fetch(`${USER_API_ENDPOINT}/${data.userId}`, {
      headers: {
        'Authorization': `Bearer ${data.token}`
      }
    });
    
    const userData = await userResponse.json();
    
    // Store user data in extension storage
    chrome.storage.local.set({
      userId: data.userId,
      token: data.token,
      petType: userData.petType || 'dragon',
      goals: userData.goals || [],
      petHealth: 100,
      productiveCount: 0,
      unproductiveCount: 0
    });
    
    // Send login message to background script
    chrome.runtime.sendMessage({
      action: 'login',
      userId: data.userId,
      goals: userData.goals || [],
      petType: userData.petType || 'dragon'
    });
    
    // Show pet section
    loginSection.classList.add('hidden');
    petSection.classList.remove('hidden');
    
    // Update UI
    updatePetDisplay(100);
    populateGoalsList(userData.goals || []);
    
  } catch (error) {
    console.error('Login error:', error);
    showError('Connection error. Please try again.');
  }
}

// Handle logout
function handleLogout() {
  // Clear storage
  chrome.storage.local.set({
    userId: null,
    token: null,
    goals: [],
    petHealth: 100,
    productiveCount: 0,
    unproductiveCount: 0
  });
  
  // Send logout message to background script
  chrome.runtime.sendMessage({ action: 'logout' });
  
  // Show login section
  petSection.classList.add('hidden');
  settingsSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
  
  // Clear inputs
  emailInput.value = '';
  passwordInput.value = '';
}

// Update pet display based on health
function updatePetDisplay(health) {
  healthValue.textContent = health;
  healthBar.style.width = `${health}%`;
  
  // Change color based on health level
  if (health > 70) {
    healthBar.style.backgroundColor = '#4CAF50'; // Green
    petImage.src = 'assets/pet-normal.png';
  } else if (health > 30) {
    healthBar.style.backgroundColor = '#FFC107'; // Yellow
    petImage.src = 'assets/pet-worried.png';
  } else if (health > 0) {
    healthBar.style.backgroundColor = '#F44336'; // Red
    petImage.src = 'assets/pet-sad.png';
  } else {
    healthBar.style.backgroundColor = '#F44336'; // Red
    petImage.src = 'assets/pet-dead.png';
  }
}

// Populate goals list
function populateGoalsList(goals) {
  goalsList.innerHTML = '';
  
  if (goals.length === 0) {
    goalsList.innerHTML = '<li>No goals set. Add goals in the main app.</li>';
    return;
  }
  
  goals.forEach(goal => {
    const li = document.createElement('li');
    li.textContent = goal;
    goalsList.appendChild(li);
  });
}

// Show settings section
function showSettings() {
  petSection.classList.add('hidden');
  loginSection.classList.add('hidden');
  settingsSection.classList.remove('hidden');
}

// Hide settings section
function hideSettings() {
  settingsSection.classList.add('hidden');
  
  // Show appropriate section based on login status
  chrome.storage.local.get(['userId'], (result) => {
    if (result.userId) {
      petSection.classList.remove('hidden');
    } else {
      loginSection.classList.remove('hidden');
    }
  });
}

// Save settings
function saveSettings() {
  const petType = petTypeSelect.value;
  const showNotifications = notificationToggle.checked;
  
  // Save settings to storage
  chrome.storage.local.set({
    petType: petType,
    showNotifications: showNotifications
  });
  
  // Update pet image
  petImage.src = `assets/${petType}-normal.png`;
  
  // Hide settings section
  hideSettings();
}

// Open signup page
function openSignupPage() {
  chrome.tabs.create({ url: 'https://wildhacks.vercel.app/signup' });
}

// Show error message
function showError(message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  
  // Remove any existing error messages
  const existingError = document.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Add error message to login section
  loginSection.insertBefore(errorElement, loginBtn);
  
  // Remove error after 3 seconds
  setTimeout(() => {
    errorElement.remove();
  }, 3000);
}
