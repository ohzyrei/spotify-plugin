(function() {
    "use strict";

    // ---- Network ad blocking ----
    const AD_PATTERNS = [
        /ads\.spotify\.com/,
        /ad-[\w]+\.spotify\.com/,
        /audio-ak-spotify\.com\/ad/,
        /spclient\.wg\.spotify\.com\/ad/,
        /doubleclick\.net/
    ];

    const origFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === "string" && AD_PATTERNS.some(p => p.test(url))) {
            return Promise.reject(new Error("Ad blocked"));
        }
        return origFetch.apply(this, args);
    };

    const origXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        if (typeof url === "string" && AD_PATTERNS.some(p => p.test(url))) {
            this.abort();
            return;
        }
        return origXHROpen.call(this, method, url, ...rest);
    };

    // ---- Premium spoof ----
    function spoofPremium() {
        try {
            localStorage.setItem("spicetify-exp-features", JSON.stringify({
                enableEsperantoMigration: true,
                enableInAppMessaging: false,
                hideUpgradeCTA: true,
                enablePremiumUserForMiniPlayer: true
            }));
            sessionStorage.setItem("premium", "true");
            document.cookie = "premium=true; path=/";
            // Also try to set product state if available later
        } catch(e) {}
    }
    spoofPremium();

    // ---- Player ad patching ----
    function patchPlayer() {
        let player = window.Spotify?.Player ||
                     window?.spicetify?.Player ||
                     document.querySelector("audio")?.__reactInternalInstance$?.return?.stateNode?.props?.player;

        if (!player) {
            setTimeout(patchPlayer, 500);
            return;
        }

        // Override playAd, loadAd
        if (player.playAd) {
            const origPlayAd = player.playAd;
            player.playAd = function(ad) {
                console.log("[patcher] Skipping ad:", ad);
                this.skipAd ? this.skipAd() : this.nextTrack();
                return Promise.resolve();
            };
        }
        if (player.loadAd) {
            player.loadAd = function() {
                console.log("[patcher] Ad load blocked");
                return Promise.resolve({});
            };
        }

        // Kill ad manager
        if (player._adManager) {
            const mgr = player._adManager;
            mgr.loadAd = () => Promise.resolve();
            mgr.playAd = () => Promise.resolve();
            mgr.skipAd = () => Promise.resolve();
            mgr.isAdPlaying = () => false;
        }

        // Force state
        if (player._state) {
            Object.defineProperty(player._state, "isAdPlaying", {
                get: () => false,
                set: () => {}
            });
        }

        console.log("[patcher] Player patched");
    }
    setTimeout(patchPlayer, 1000);

    // ---- Remove ad UI elements periodically ----
    function cleanAds() {
        document.querySelectorAll([
            '[data-testid="context-item-info-ads"]',
            '[data-testid*="ad-slot"]',
            '[data-testid*="hpto"]',
            '.main-leaderboardComponent-container',
            '.sponsor-container',
            'div[class*="LeaderboardAd"]',
            'div[class*="BillboardAd"]',
            'iframe[src*="doubleclick"]',
            'iframe[src*="googlesyndication"]',
            'a[href^="https://www.spotify.com/premium/"]',
            '.upgrade-button',
            '.main-topBar-UpgradeButton',
            '.main-contextMenu-menuItem a[href*="premium"]'
        ]).forEach(el => el.remove());
    }

    const observer = new MutationObserver(cleanAds);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setInterval(cleanAds, 2000);

    // ---- CSS to hide ads ----
    const style = document.createElement("style");
    style.id = "spotify-patcher-adblock";
    style.textContent = `
        [data-testid="context-item-info-ads"],
        [data-testid*="ad-slot"],
        [data-testid*="hpto"],
        .main-leaderboardComponent-container,
        .sponsor-container,
        div[class*="LeaderboardAd"],
        div[class*="BillboardAd"],
        iframe[src*="doubleclick"],
        iframe[src*="googlesyndication"],
        a[href^="https://www.spotify.com/premium/"],
        .upgrade-button,
        .main-topBar-UpgradeButton,
        .main-contextMenu-menuItem a[href*="premium"] {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    // ---- Simple badge (no logo) ----
    (function addBadge() {
        const badge = document.createElement("div");
        badge.id = "spotify-patcher-badge";
        Object.assign(badge.style, {
            position: "fixed",
            top: "18px",
            left: "140px",
            zIndex: "999999",
            backgroundColor: "#0993ff",
            color: "#fff",
            fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
            fontSize: "12px",
            fontWeight: "600",
            padding: "5px 12px",
            borderRadius: "6px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            pointerEvents: "none",
            userSelect: "none",
            letterSpacing: "0.3px",
            textShadow: "0 1px 2px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "6px"
        });
        const text = document.createTextNode("NovaLuna.cc");
        badge.appendChild(text);
        const append = () => {
            if (document.body) document.body.appendChild(badge);
            else requestAnimationFrame(append);
        };
        append();
    })();

    // ---- Spicetify-based full adblockify (if available) ----
    function initAdblockify() {
        if (typeof window.Spicetify === "undefined" || !window.Spicetify.Events) {
            setTimeout(initAdblockify, 2000);
            return;
        }
        console.log("[patcher] Spicetify API detected – activating deep adblock");

        // Deep adblock logic from SpotX style
        (async function() {
            const waitFor = async (fn, interval = 50, attempts = 20) => {
                for (let i = 0; i < attempts; i++) {
                    const res = fn();
                    if (res !== undefined) return res;
                    await new Promise(r => setTimeout(r, interval));
                }
                return fn();
            };

            const getChunkQueue = () => window?.webpackChunkclient_web || window?.rspackChunkclient_web;

            const loadWebpack = async () => {
                try {
                    const queue = await waitFor(getChunkQueue, 50);
                    if (!queue) throw new Error("No webpack queue");
                    const push = queue.push([[Symbol()], {}, c => c]);
                    const modules = Object.keys(push.m).map(id => push(id));
                    const objects = modules.filter(m => typeof m === "object").flatMap(m => {
                        try { return Object.values(m); } catch { return []; }
                    });
                    const funcs = objects.flatMap(o => {
                        if (typeof o === "function") return [o];
                        if (typeof o === "object" && o) {
                            return Object.values(o).filter(f => typeof f === "function" && !new Set(Object.values(push.m)).has(f));
                        }
                        return [];
                    });
                    return { cache: modules, functionModules: funcs };
                } catch(e) {
                    console.error("adblockify: loadWebpack failed", e);
                    return { cache: [], functionModules: [] };
                }
            };

            const { Platform, Locale } = Spicetify;
            const { AdManagers } = Platform;
            if (!AdManagers?.audio) {
                setTimeout(initAdblockify, 1000);
                return;
            }

            const { audio: audioAd } = AdManagers;
            const { UserAPI } = Platform;
            const productState = UserAPI._product_state || UserAPI._product_state_service || Platform?.ProductStateAPI?.productStateApi;
            const version = Platform.version.split(".").map(Number);
            const { CosmosAsync } = Spicetify;

            let slots = [];
            const webpack = await loadWebpack();
            const SlotsClient = webpack.functionModules.find(m => m.SERVICE_ID === "spotify.ads.esperanto.slots.proto.Slots" || m.SERVICE_ID === "spotify.ads.esperanto.proto.Slots");
            if (SlotsClient) {
                const client = new SlotsClient(productState.transport);
                slots = (await client.getSlots()).adSlots;
            } else {
                try { slots = await CosmosAsync.get("sp://ads/v1/slots"); } catch {}
            }

            // Disable ad managers
            const disableAll = async () => {
                try {
                    await audioAd.disable();
                    audioAd.isNewAdsNpvEnabled = false;
                    if (AdManagers.billboard) await AdManagers.billboard.disable();
                    if (AdManagers.leaderboard) await AdManagers.leaderboard.disableLeaderboard();
                    if (AdManagers.sponsoredPlaylist) await AdManagers.sponsoredPlaylist.disable();
                    if (AdManagers.inStreamApi) await AdManagers.inStreamApi.disable();
                    if (AdManagers.vto) {
                        await AdManagers.vto.manager.disable();
                        AdManagers.vto.isNewAdsNpvEnabled = false;
                    }
                    // Force product state
                    if (productState?.putOverridesValues) {
                        await productState.putOverridesValues({
                            pairs: { ads: "0", catalogue: "premium", product: "premium", type: "premium" }
                        });
                    }
                } catch(e) { console.error("adblockify disable failed", e); }
            };

            // Subscribe to slots and clear
            const clearSlot = (slotId) => {
                try {
                    const core = audioAd?.inStreamApi?.adsCoreConnector;
                    if (core?.clearSlot) core.clearSlot(slotId);
                    const client = new SlotsClient(productState.transport);
                    if (client) client.clearAllAds({ slotId });
                } catch(e) {}
            };

            // Update slot settings
            const updateSlot = async (slotId) => {
                try {
                    const SettingsClient = webpack.functionModules.find(m =>
                        m.SERVICE_ID === "spotify.ads.esperanto.settings.proto.Settings" ||
                        m.SERVICE_ID === "spotify.ads.esperanto.proto.Settings"
                    );
                    if (!SettingsClient) return;
                    const client = new SettingsClient(productState.transport);
                    const zero = (version[0] === 1 && version[1] >= 2 && version[2] >= 82) ? 0n : "0";
                    await client.updateAdServerEndpoint({ slotIds: [slotId], url: "http://localhost/no/thanks" });
                    await client.updateStreamTimeInterval({ slotId, timeInterval: zero });
                    await client.updateSlotEnabled({ slotId, enabled: false });
                    await client.updateDisplayTimeInterval({ slotId, timeInterval: zero });
                } catch(e) {}
            };

            for (const slot of slots) {
                const id = slot.slotId || slot.slot_id;
                clearSlot(id);
                setTimeout(() => updateSlot(id), 100);
            }

            // Also set remote config
            try {
                const exp = JSON.parse(localStorage.getItem("spicetify-exp-features") || "{}");
                Object.assign(exp, {
                    enableEsperantoMigration: true,
                    enableInAppMessaging: false,
                    hideUpgradeCTA: true,
                    enablePremiumUserForMiniPlayer: true
                });
                localStorage.setItem("spicetify-exp-features", JSON.stringify(exp));
            } catch(e) {}

            // Apply CSS for ad hiding (already done above)
            disableAll();
        })();
    }
    setTimeout(initAdblockify, 3000);
})();
