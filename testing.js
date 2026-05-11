// safer-twitch-helper.js
(function () {
    if (!/(^|\.)twitch\.tv$/.test(document.location.hostname)) {
        return;
    }

    console.log("[Safe Twitch Helper] Loaded");

    const AD_SIGNIFIER = 'stitched-ad';

    let overlay = null;

    function getOverlay() {
        const player = document.querySelector('.video-player');

        if (!player) return null;

        let div = player.querySelector('.safe-twitch-overlay');

        if (!div) {
            div = document.createElement('div');
            div.className = 'safe-twitch-overlay';

            div.style.position = 'absolute';
            div.style.top = '0';
            div.style.left = '0';
            div.style.padding = '6px 10px';
            div.style.background = 'rgba(0,0,0,0.7)';
            div.style.color = 'white';
            div.style.fontSize = '14px';
            div.style.zIndex = '999999';
            div.style.display = 'none';

            player.appendChild(div);
        }

        return div;
    }

    function showOverlay(text) {
        overlay = overlay || getOverlay();

        if (!overlay) return;

        overlay.textContent = text;
        overlay.style.display = 'block';
    }

    function hideOverlay() {
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Preserve original fetch
    const realFetch = window.fetch.bind(window);

    // Safe fetch wrapper
    window.fetch = async function (...args) {
        try {
            const response = await realFetch(...args);

            const url = typeof args[0] === 'string'
                ? args[0]
                : args[0]?.url || '';

            // ONLY inspect Twitch playlist files
            if (
                typeof url === 'string' &&
                url.includes('.m3u8')
            ) {
                try {
                    const clone = response.clone();
                    const text = await clone.text();

                    if (text.includes(AD_SIGNIFIER)) {
                        console.log('[Safe Twitch Helper] Ad marker detected');
                        showOverlay('Ad segment detected');
                    } else {
                        hideOverlay();
                    }
                } catch (e) {
                    console.warn('[Safe Twitch Helper] Playlist read failed', e);
                }
            }

            return response;
        } catch (err) {
            console.error('[Safe Twitch Helper] Fetch error', err);
            throw err;
        }
    };

})();
