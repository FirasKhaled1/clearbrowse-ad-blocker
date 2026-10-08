// 1. Enable the badge counter globally when installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.declarativeNetRequest.setExtensionActionOptions({
        displayActionCountAsBadgeText: true
    });
});

// 2. Function to determine and set the correct icon color
async function updateIconForTab(tabId, url) {
    // Ignore internal Chrome pages
    if (!url || !url.startsWith('http')) return;

    try {
        const domain = new URL(url).hostname;
        const storage = await chrome.storage.local.get(['allowlist']);
        const allowlist = storage.allowlist || [];

        if (allowlist.includes(domain)) {
            // Site is allowlisted (blocking OFF) -> Gray Icon
            chrome.action.setIcon({
                tabId: tabId,
                path: {
                    "16": "icons/icon16_gray.png",
                    "48": "icons/icon48_gray.png",
                    "128": "icons/icon128_gray.png"
                }
            });
            // Optional: clear the blocked count badge so it doesn't show a number when off
            chrome.action.setBadgeText({ tabId: tabId, text: "" });
        } else {
            // Site is blocked (blocking ON) -> Blue Icon
            chrome.action.setIcon({
                tabId: tabId,
                path: {
                    "16": "icons/icon16.png",
                    "48": "icons/icon48.png",
                    "128": "icons/icon128.png"
                }
            });
        }
    } catch (e) {
        console.error("Error updating icon:", e);
    }
}

// 3. Listen for the user switching between browser tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    updateIconForTab(tab.id, tab.url);
});

// 4. Listen for pages finishing their loading sequence
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.status === 'complete') {
        updateIconForTab(tabId, tab.url);
    }
});