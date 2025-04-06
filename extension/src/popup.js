// Popup JavaScript for the GoalKeeper Pet extension

// DOM elements
const loginSection = document.getElementById('login-section');
const petSection = document.getElementById('pet-section');
const loginBtn = document.getElementById('login-btn');
const emailInput = document.getElementById('email-input');
const logoutBtn = document.getElementById('logout-btn');
const loginError = document.getElementById('login-error');
const statusMessage = document.getElementById('status-message');

// Initialize popup
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  chrome.storage.local.get(['isLoggedIn', 'userEmail'], function(result) {
    if (result.isLoggedIn && result.userEmail) {
      // User is logged in, show pet section
      loginSection.classList.add('hidden');
      petSection.classList.remove('hidden');
      
      // Get active tab URL
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const activeTab = tabs[0];
        const activeTabUrl = activeTab ? activeTab.url : 'No active tab';
        
        // Update status message with active tab URL
        statusMessage.textContent = `Logged in as: ${result.userEmail}. Tab tracking is active. Current tab: ${activeTabUrl}`;
      });
    }
  });
  
  // Add event listeners
  loginBtn.addEventListener('click', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
});

// Handle simple email login
function handleLogin() {
  try {
    // Get email from input
    const email = emailInput.value.trim();
    
    // Validate email
    if (!email || !validateEmail(email)) {
      showLoginError('Please enter a valid email address.');
      return;
    }
    
    // Show loading state
    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;
    
    // Store user data
    chrome.storage.local.set({
      isLoggedIn: true,
      userEmail: email
    }, function() {
      console.log('User logged in with email:', email);
      
      // Send login message to background script
      chrome.runtime.sendMessage({
        action: 'login',
        userEmail: email
      });
      
      // Show pet section
      loginSection.classList.add('hidden');
      petSection.classList.remove('hidden');
      
      // Get active tab URL and update status message
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const activeTab = tabs[0];
        const activeTabUrl = activeTab ? activeTab.url : 'No active tab';
        
        // Update status message with active tab URL
        statusMessage.textContent = `Logged in as: ${email}. Tab tracking is active. Current tab: ${activeTabUrl}`;
      });
      
      // Reset button
      loginBtn.textContent = 'Login';
      loginBtn.disabled = false;
    });
  } catch (error) {
    console.error('Login error:', error);
    showLoginError('Login failed. Please try again.');
    loginBtn.textContent = 'Login';
    loginBtn.disabled = false;
  }
}

// Validate email format
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Handle logout
function handleLogout() {
  try {
    // Clear storage
    chrome.storage.local.set({
      isLoggedIn: false,
      userEmail: null
    });
    
    // Send logout message to background script
    chrome.runtime.sendMessage({ action: 'logout' });
    
    // Show login section
    petSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    
    // Clear email input
    emailInput.value = '';
  } catch (error) {
    console.error('Logout error:', error);
    showLoginError('Logout failed. Please try again.');
  }
}

// Show login error message
function showLoginError(message) {
  loginError.textContent = message;
  loginError.classList.remove('hidden');
  
  // Hide error after 3 seconds
  setTimeout(() => {
    loginError.classList.add('hidden');
  }, 3000);
}
