// content.js - Lightweight intermediary script
// This file ensures there's no conflict with the content-script.js file
// It simply forwards messages without creating duplicate variables

console.log('Waddl Extension content.js loaded');

// Listen for messages from the background script and forward them to content-script.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content.js received message:', request);
  
  // Forward the message to the content-script.js via a custom event
  document.dispatchEvent(new CustomEvent('GOALKEEPER_INTERNAL_MESSAGE', {
    detail: {
      request: request,
      sender: sender,
      sendResponse: (response) => {
        console.log('Forwarding response back:', response);
        sendResponse(response);
      }
    }
  }));
  
  // Return true to indicate we'll respond asynchronously
  return true;
});