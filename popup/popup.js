document.addEventListener('DOMContentLoaded', async () => {
    const domainText = document.getElementById('current-domain');
    const siteToggle = document.getElementById('site-toggle');
    const pageCountText = document.getElementById('page-count');

    // 1. Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Guard: Prevent errors on internal pages (chrome://, new tab, settings)
    if (!tab || !tab.url || !tab.url.startsWith('http')) {
        domainText.textContent = 'Browser System Page';
        siteToggle.disabled = true;
        pageCountText.textContent = '0';
        return;
    }

    let domain = '';
    try {
        const url = new URL(tab.url);
        domain = url.hostname;
        domainText.textContent = domain;
    } catch (e) {
        domainText.textContent = 'Unsupported URL';
        siteToggle.disabled = true;
        return;
    }

    // 2. Get the "on this page" blocked count from the extension badge
    chrome.action.getBadgeText({ tabId: tab.id }, (badgeText) => {
        pageCountText.textContent = badgeText || "0";
    });

    // 3. Check if this domain is currently in our allowlist (saved in storage)
    const storage = await chrome.storage.local.get(['allowlist']);
    let allowlist = storage.allowlist || [];
    
    // If the domain is in the allowlist, the switch should be OFF (unchecked)
    if (allowlist.includes(domain)) {
        siteToggle.checked = false;
    }

    // 4. Listen for the user clicking the toggle switch
    siteToggle.addEventListener('change', async () => {
        if (siteToggle.checked) {
            // User turned blocking ON: Remove domain from allowlist
            allowlist = allowlist.filter(d => d !== domain);
        } else {
            // User turned blocking OFF: Add domain to allowlist
            if (!allowlist.includes(domain)) {
                allowlist.push(domain);
            }
        }

        // Save the updated list back to storage
        await chrome.storage.local.set({ allowlist: allowlist });

        // Update Chrome's declarativeNetRequest rules
        await updateBlockingRules(allowlist);
        
        // Reload the tab so the new settings take effect instantly
        chrome.tabs.reload(tab.id);
    });
});

// Helper function to update Chrome's internal routing
async function updateBlockingRules(allowlist) {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingIds = existingRules.map(rule => rule.id);

    // Create a new "allowAllRequests" rule for every domain in our allowlist
    const newRules = allowlist.map((domain, index) => {
        return {
            id: 1000 + index,  // Rule IDs must be unique numbers
            priority: 100,     // High priority overrides standard blocking
            action: { type: 'allowAllRequests' },
            condition: {
                requestDomains: [domain],
                resourceTypes: ['main_frame', 'sub_frame']
            }
        };
    });

    // Swap out old rules for the updated list
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingIds,
        addRules: newRules
    });
}