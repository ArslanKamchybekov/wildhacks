# Waddl Pet Browser Extension

This browser extension works alongside the Waddl web application to help you stay focused on your goals. It monitors your browsing habits and affects your virtual pet's health based on how productive your browsing is.

## Features

- **Pet Health Monitoring**: Your virtual pet loses health when you visit sites that distract from your goals
- **Real-time Feedback**: Get notifications about whether the current site is helping or hurting your productivity
- **Goal Integration**: Connects with your goals from the Waddl web app
- **Visual Pet Status**: See your pet's health and mood change based on your browsing habits

## Installation

### Chrome/Edge

1. Open Chrome/Edge and navigate to `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select the `extension` folder
4. The extension should now appear in your browser toolbar

### Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Navigate to the `extension` folder and select the `manifest.json` file
4. The extension should now appear in your browser toolbar

## Usage

1. Click the extension icon in your browser toolbar to open the popup
2. Log in with your Waddl account
3. Your pet will now monitor your browsing and provide feedback
4. The pet will appear in the bottom-right corner of your browser window
5. When you visit unproductive sites, your pet will lose health
6. Keep your pet healthy by staying focused on your goals!

## Development

### Project Structure

```
extension/
├── assets/           # Images for the pet and icons
├── src/              # Source code
│   ├── background.js # Background script for monitoring tabs
│   ├── content.js    # Content script injected into pages
│   ├── content.css   # Styling for the pet and notifications
│   ├── popup.html    # Popup UI
│   ├── popup.js      # Popup functionality
│   └── popup.css     # Popup styling
└── manifest.json     # Extension manifest
```

### Building for Production

1. Make sure all files are in place
2. Zip the `extension` folder
3. Submit to browser extension stores

## API Integration

The extension communicates with the Waddl API to:
- Authenticate users
- Retrieve user goals
- Check URL productivity
- Update pet health

## Privacy

This extension only tracks the URLs you visit to determine if they align with your goals. This data is only used locally and to update your pet's health in the Waddl application. No browsing history is stored or shared with third parties.
