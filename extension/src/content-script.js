// Content script for the GoalKeeper extension
// This script handles communication between the web app and the extension

// Automatically check for connection data in localStorage when the content script loads
function checkForConnectionData() {
  console.log('Content script running on:', window.location.href);
  
  // Only run on our web app domain
  if (window.location.origin !== 'http://localhost:3000') {
    console.log('Not on localhost:3000, skipping connection check');
    return;
  }
  
  console.log('Checking for connection data in localStorage...');
  
  try {
    // Create a visible debug element on the page
    const debugElement = document.createElement('div');
    debugElement.id = 'goalkeeper-debug';
    debugElement.style.position = 'fixed';
    debugElement.style.bottom = '50px';
    debugElement.style.left = '10px';
    debugElement.style.padding = '10px';
    debugElement.style.background = 'rgba(0,0,0,0.7)';
    debugElement.style.color = 'white';
    debugElement.style.zIndex = '9999';
    debugElement.style.borderRadius = '5px';
    debugElement.style.maxWidth = '300px';
    debugElement.style.fontSize = '12px';
    debugElement.textContent = 'Extension content script active, checking localStorage...';
    document.body.appendChild(debugElement);
    
    // Check localStorage
    const connectionDataString = localStorage.getItem('goalkeeper_extension_data');
    console.log('Connection data found:', connectionDataString);
    
    if (connectionDataString) {
      const connectionData = JSON.parse(connectionDataString);
      debugElement.textContent = 'Connection data found! Sending to extension...';
      
      // Forward the connection data to the extension
      chrome.runtime.sendMessage({
        type: 'GOALKEEPER_CONNECT_DATA',
        data: connectionData
      }, function(response) {
        if (chrome.runtime.lastError) {
          debugElement.textContent = 'Error: ' + chrome.runtime.lastError.message;
          console.error('Runtime error:', chrome.runtime.lastError);
        } else if (response && response.success) {
          debugElement.textContent = 'Connected successfully!';
          console.log('Connection successful:', response);
        } else {
          debugElement.textContent = 'Sent data but no success confirmation';
        }
      });
      
      console.log('Found and sent connection data automatically');
    } else {
      debugElement.textContent = 'No connection data found in localStorage';
    }
  } catch (error) {
    console.error('Error checking for connection data:', error);
    
    // Update debug element with error
    const debugElement = document.getElementById('goalkeeper-debug');
    if (debugElement) {
      debugElement.textContent = 'Error: ' + error.message;
      debugElement.style.background = 'rgba(255,0,0,0.7)';
    }
  }
}

// Run the check when the content script loads
checkForConnectionData();

// Listen for both postMessage and custom events from the web page
window.addEventListener('message', function(event) {
  console.log('Received message event:', event.data);
  
  // Only accept messages from our web app domain
  if (event.origin !== 'http://localhost:3000') {
    console.log('Ignoring message from non-localhost origin:', event.origin);
    return;
  }

  // Check if this is a connection message
  if (event.data && event.data.type === 'GOALKEEPER_CONNECT') {
    console.log('Received GOALKEEPER_CONNECT message');
    
    // Get the connection data
    const connectionData = event.data.data;
    
    // Validate connection data
    if (!connectionData || !connectionData.userId || !connectionData.userEmail) {
      console.error('Invalid connection data received');
      return;
    }
    
    // Update debug element
    const debugElement = document.getElementById('goalkeeper-debug');
    if (debugElement) {
      debugElement.textContent = 'Received connection data via postMessage, sending to extension...';
    }
    
    // Forward the connection data to the extension
    chrome.runtime.sendMessage({
      type: 'GOALKEEPER_CONNECT_DATA',
      data: connectionData
    }, function(response) {
      if (debugElement) {
        if (chrome.runtime.lastError) {
          debugElement.textContent = 'Error: ' + chrome.runtime.lastError.message;
        } else {
          debugElement.textContent = 'Sent connection data to extension!';
        }
      }
    });
    
    // Confirm receipt to the web page
    window.postMessage({
      type: 'GOALKEEPER_CONNECT_RECEIVED',
      success: true
    }, '*');
  }
});

// Listen for custom event
window.addEventListener('GOALKEEPER_CONNECT_EVENT', function(event) {
  console.log('Received custom event:', event);
  
  // Get the connection data from the event detail
  const connectionData = event.detail;
  
  // Update debug element
  const debugElement = document.getElementById('goalkeeper-debug');
  if (debugElement) {
    debugElement.textContent = 'Received connection data via custom event, sending to extension...';
  }
  
  // Forward the connection data to the extension
  chrome.runtime.sendMessage({
    type: 'GOALKEEPER_CONNECT_DATA',
    data: connectionData
  });
});

// Listen for messages from the extension
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Content script received message from extension:', message);
  
  if (message.action === 'checkConnectionData') {
    console.log('Checking for connection data upon request');
    
    // Update debug element
    const debugElement = document.getElementById('goalkeeper-debug');
    if (debugElement) {
      debugElement.textContent = 'Extension requested connection data check...';
    }
    
    // Try to get connection data from localStorage
    try {
      const connectionDataString = localStorage.getItem('goalkeeper_extension_data');
      console.log('Connection data from localStorage:', connectionDataString);
      
      if (connectionDataString) {
        const connectionData = JSON.parse(connectionDataString);
        
        if (debugElement) {
          debugElement.textContent = 'Found connection data, sending to extension...';
        }
        
        // Forward the connection data to the extension
        chrome.runtime.sendMessage({
          type: 'GOALKEEPER_CONNECT_DATA',
          data: connectionData
        });
        
        // Don't clear the connection data yet for debugging purposes
        // localStorage.removeItem('goalkeeper_extension_data');
        
        sendResponse({success: true, message: 'Connection data found and sent'});
        return true;
      } else {
        if (debugElement) {
          debugElement.textContent = 'No connection data found in localStorage';
        }
        sendResponse({success: false, message: 'No connection data found'});
      }
    } catch (error) {
      console.error('Error retrieving connection data:', error);
      if (debugElement) {
        debugElement.textContent = 'Error retrieving connection data: ' + error.message;
      }
      sendResponse({success: false, error: error.message});
    }
    return true;
  }
});
