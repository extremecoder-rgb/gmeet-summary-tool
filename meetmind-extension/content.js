// Content script injected into meet.google.com
console.log('MeetMind content script loaded');

// Listen for messages from background or popup if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkMeetPage') {
    sendResponse({ isMeet: window.location.href.includes('meet.google.com') });
  }
});