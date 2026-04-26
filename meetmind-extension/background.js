let recording = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startCapture') {
    handleStartCapture(sendResponse);
    return true;
  } else if (message.action === 'stopCapture') {
    handleStopCapture(sendResponse);
    return true;
  } else if (message.action === 'getState') {
    sendResponse({ isRecording: recording });
    return true;
  } else if (message.action === 'summaryReady') {
    console.log('Background: Summary received from offscreen, storing');
    chrome.storage.local.set({ summary: message.data });
  } else if (message.action === 'offscreenReady') {
    console.log('Background: Offscreen document is ready');
  }
});

async function handleStartCapture(sendResponse) {
  console.log('Background: Received startCapture request');
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    if (!activeTab || !activeTab.url.includes('meet.google.com')) {
      console.error('Background: Not on Google Meet');
      sendResponse({ error: 'Please open Google Meet first' });
      return;
    }

    // Get stream ID FIRST (requires user gesture context)
    console.log('Background: Getting MediaStreamId for tab', activeTab.id);
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: activeTab.id });
    console.log('Background: StreamId obtained:', streamId);

    // Create offscreen document if needed
    const existingContexts = await chrome.runtime.getContexts({});
    const offscreenDoc = existingContexts.find(c => c.contextType === 'OFFSCREEN_DOCUMENT');
    
    if (!offscreenDoc) {
      console.log('Background: Creating offscreen document');
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'Capture tab audio for transcription'
      });
      // Wait for offscreen document to fully load
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Send streamId to offscreen document
    console.log('Background: Sending streamId to offscreen document');
    chrome.runtime.sendMessage({
      action: 'startCapture',
      target: 'offscreen',
      streamId: streamId
    });

    recording = true;
    sendResponse({ status: 'started' });
  } catch (error) {
    console.error('Background error in startCapture:', error);
    sendResponse({ error: error.message });
  }
}

async function handleStopCapture(sendResponse) {
  console.log('Background: Received stopCapture request');
  try {
    chrome.runtime.sendMessage({
      action: 'stopCapture',
      target: 'offscreen'
    });

    // Give offscreen time to finalize recording before closing
    await new Promise(resolve => setTimeout(resolve, 1000));

    const existingContexts = await chrome.runtime.getContexts({});
    const offscreenDoc = existingContexts.find(c => c.contextType === 'OFFSCREEN_DOCUMENT');
    if (offscreenDoc) {
      await chrome.offscreen.closeDocument();
    }

    recording = false;
    sendResponse({ status: 'stopped' });
  } catch (error) {
    console.error('Background error in stopCapture:', error);
    sendResponse({ error: error.message });
  }
}