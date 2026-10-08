(async function initializeClearBrowse() {
    const currentDomain = window.location.hostname;

    // 1. Check if the active website is on the user's allowlist
    try {
        const data = await chrome.storage.local.get(['allowlist']);
        const allowlist = data.allowlist || [];
        if (allowlist.includes(currentDomain)) {
            // User disabled blocking for this site; exit immediately
            return;
        }
    } catch (e) {
        // Storage access may fail on sandboxed pages; proceed safely
    }

    // 2. YouTube-specific Video Ad Accelerator & Auto-Skipper
    if (currentDomain.includes('youtube.com')) {
        observeYouTubePlayer();
    }

    // 3. Amazon-specific Fallback Scanner (handles dynamic infinite scroll)
    if (currentDomain.includes('amazon.')) {
        observeAmazonListings();
    }
})();

/**
 * Monitors YouTube's player element to skip or fast-forward video ads.
 */
function observeYouTubePlayer() {
    const observer = new MutationObserver(() => {
        const player = document.querySelector('#movie_player');
        if (!player) return;

        const isAdShowing = player.classList.contains('ad-showing') || 
                            player.classList.contains('ad-interrupting');

        if (isAdShowing) {
            const video = document.querySelector('video');
            if (video && !isNaN(video.duration)) {
                // Mute and fast-forward the ad segment to completion
                video.muted = true;
                video.currentTime = video.duration;
            }

            // Click the native skip button if rendered
            const skipButton = document.querySelector(
                '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button'
            );
            if (skipButton) {
                skipButton.click();
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
}

/**
 * Scans Amazon search listings for text labels that CSS selectors might miss.
 */
function observeAmazonListings() {
    const hideSponsoredCards = () => {
        const cards = document.querySelectorAll('div[data-asin]:not([data-cb-scanned])');
        cards.forEach((card) => {
            card.setAttribute('data-cb-scanned', 'true');
            // Check text contents for the specific sponsored badge string
            const isSponsored = Array.from(card.querySelectorAll('span, aria-label')).some(el => {
                return el.textContent && el.textContent.trim().toLowerCase() === 'sponsored';
            });

            if (isSponsored) {
                card.style.setProperty('display', 'none', 'important');
            }
        });
    };

    const observer = new MutationObserver(hideSponsoredCards);
    observer.observe(document.body, { childList: true, subtree: true });
    hideSponsoredCards();
}