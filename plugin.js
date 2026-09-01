console.log("[spotify-patcher] custom mod loaded");

(function addPatchedBadge() {
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

    const logo = document.createElement("img");
    // REPLACE THE BASE64 STRING BELOW WITH YOUR ACTUAL LOGO DATA
    // You can generate it using any online tool: image to base64
    // Then paste it between the quotes (keep the "data:image/png;base64," prefix)
    const LOGO_BASE64 = "data:image/png;base64,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"; // placeholder 1x1 transparent
    logo.src = LOGO_BASE64;
    logo.style.height = "14px";
    logo.style.width = "auto";
    logo.style.display = "block";
    badge.appendChild(logo);

    const text = document.createTextNode(" NovaLuna.cc");
    badge.appendChild(text);

    const appendWhenReady = () => {
        if (document.body) {
            document.body.appendChild(badge);
        } else {
            requestAnimationFrame(appendWhenReady);
        }
    };
    appendWhenReady();
})();

(function basicAdBlock() {
    const css = document.createElement("style");
    css.id = "spotify-patcher-adblock";
    css.textContent = `
        [data-testid="context-item-info-ads"],
        [data-testid*="ad-slot"],
        [data-testid*="hpto"],
        .main-leaderboardComponent-container,
        .sponsor-container,
        div[class*="LeaderboardAd"],
        div[class*="BillboardAd"],
        iframe[src*="doubleclick"],
        iframe[src*="googlesyndication"],
        a[href^="https://www.spotify.com/premium/"] {
            display: none !important;
        }
    `;
    document.head.appendChild(css);
    const observer = new MutationObserver(() => {});
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();

(function adblockifyGated() {
    const waitForSpicetifyThenRun = () => {
        if (typeof window.Spicetify === "undefined" || !window.Spicetify.Events) {
            setTimeout(waitForSpicetifyThenRun, 2000);
            return;
        }
        console.log("[spotify-patcher] Spicetify API detected — activating full adblockify");
        runAdblockify();
    };
    function runAdblockify() {
        "use strict";
        const waitFor = async (o, n = 50, s = 20) => {
            for (let a = 0; a < s; a++) {
                const r = o();
                if (r !== void 0) return r;
                await new Promise(u => setTimeout(u, n));
            }
            return o();
        };
        const getChunkQueue = () => window?.webpackChunkclient_web || window?.rspackChunkclient_web;
        const loadWebpack = async () => {
            try {
                const o = await waitFor(getChunkQueue, 50);
                if (!o) throw new Error("Could not find webpack/rspack chunk queue");
                const n = o.push([[Symbol()], {}, c => c]),
                    s = Object.keys(n.m).map(c => n(c)),
                    a = s.filter(c => typeof c === "object").flatMap(c => { try { return Object.values(c); } catch {} }),
                    r = new Set(Object.values(n.m)),
                    u = a.flatMap(c => typeof c === "function" ? [c] : typeof c === "object" && c ? Object.values(c).filter(f => typeof f === "function" && !r.has(f)) : []);
                return { cache: s, functionModules: u };
            } catch (o) {
                console.error("adblockify: Failed to load webpack", o);
                return { cache: [], functionModules: [] };
            }
        };
        const getSettingsClient = (o, n = [], s = {}) => {
            try {
                const a = o.find(r => r?.settingsClient)?.settingsClient;
                if (!a) {
                    const r = n.find(u => u?.SERVICE_ID === "spotify.ads.esperanto.settings.proto.Settings" || u?.SERVICE_ID === "spotify.ads.esperanto.proto.Settings");
                    return new r(s);
                }
                return a;
            } catch (a) {
                console.error("adblockify: Failed to get ads settings client", a);
                return null;
            }
        };
        const getSlotsClient = (o, n) => {
            try {
                const s = o.find(a => a.SERVICE_ID === "spotify.ads.esperanto.slots.proto.Slots" || a.SERVICE_ID === "spotify.ads.esperanto.proto.Slots");
                return new s(n);
            } catch (s) {
                console.error("adblockify: Failed to get slots client", s);
                return null;
            }
        };
        const getTestingClient = (o, n) => {
            try {
                const s = o.find(a => a.SERVICE_ID === "spotify.ads.esperanto.testing.proto.Testing" || a.SERVICE_ID === "spotify.ads.esperanto.proto.Testing");
                return new s(n);
            } catch (s) {
                console.error("adblockify: Failed to get testing client", s);
                return null;
            }
        };
        const map = new Map();
        const retryCounter = (o, n) => {
            if (map.has(o) || map.set(o, { count: 0 }), n === "increment") map.get(o).count++;
            else if (n === "clear") map.delete(o);
            else if (n === "get") return map.get(o)?.count;
        };
        (async function o() {
            await new Promise(e => Spicetify.Events.platformLoaded.on(e));
            await new Promise(e => Spicetify.Events.webpackLoaded.on(e));
            const n = await loadWebpack(),
                { Platform: s, Locale: a } = Spicetify,
                { AdManagers: r } = s;
            if (!r?.audio || Object.keys(r).length === 0) { setTimeout(o, 100); return; }
            const { audio: u } = r, { UserAPI: c } = s,
                f = c._product_state || c._product_state_service || s?.ProductStateAPI?.productStateApi,
                b = Spicetify.Platform.version.split(".").map(e => Number.parseInt(e));
            if (!Spicetify?.CosmosAsync) { setTimeout(o, 100); return; }
            const { CosmosAsync: w } = Spicetify;
            let m = [];
            const v = getSlotsClient(n.functionModules, f.transport);
            if (v) m = (await v.getSlots()).adSlots;
            else {
                try { m = await w.get("sp://ads/v1/slots"); }
                catch { setTimeout(o, 100); return; }
            }
            const k = () => {
                const e = document.createElement("style"), t = a.get("upgrade.tooltip.title");
                e.className = "adblockify";
                e.innerHTML = `.ScclvBC0NsMgQLQC, .Mvhjv8IKLGjQx94MVOgP, .sl_aPp6GDg05ItSfmsS7, .nHCJskDZVlmDhNNS9Ixv, .utUDWsORU96S7boXm2Aq, .cpBP3znf6dhHLA2dywjy, .G7JYBeU1c2QawLyFs5VK, .vYl1kgf1_R18FCmHgdw2, .vZkc6VwrFz0EjVBuHGmx, .iVAZDcTm1XGjxwKlQisz, ._I_1HMbDnNlNAaViEnbp, .xXj7eFQ8SoDKYXy6L3E1, .F68SsPm8lZFktQ1lWsQz, .MnW5SczTcbdFHxLZ_Z8j, .WiPggcPDzbwGxoxwLWFf, .ReyA3uE3K7oEz7PTTnAn, .x8e0kqJPS0bM4dVK7ESH, .gZ2Nla3mdRREDCwybK6X, .SChMe0Tert7lmc5jqH01, .AwF4EfqLOIJ2xO7CjHoX, .UlkNeRDFoia4UDWtrOr4, .k_RKSQxa2u5_6KmcOoSw, ._mWmycP_WIvMNQdKoAFb, .O3UuqEx6ibrxyOJIdpdg, .akCwgJVf4B4ep6KYwrk5, .bIA4qeTh_LSwQJuVxDzl, .ajr9pah2nj_5cXrAofU_, .gvn0k6QI7Yl_A0u46hKn, .obTnuSx7ZKIIY1_fwJhe, .IiLMLyxs074DwmEH4x5b, .RJjM91y1EBycwhT_wH59, .mxn5B5ceO2ksvMlI1bYz, .l8wtkGVi89_AsA3nXDSR, .Th1XPPdXMnxNCDrYsnwb, .SJMBltbXfqUiByDAkUN_, .Nayn_JfAUsSO0EFapLuY, .YqlFpeC9yMVhGmd84Gdo, .HksuyUyj1n3aTnB4nHLd, .DT8FJnRKoRVWo77CPQbQ, ._Cq69xKZBtHaaeMZXIdk, .main-leaderboardComponent-container, .sponsor-container, a.link-subtle.main-navBar-navBarLink.GKnnhbExo0U9l7Jz2rdc, button[title="${t}"], button[aria-label="${t}"], .main-topBar-UpgradeButton, .main-contextMenu-menuItem a[href^="https://www.spotify.com/premium/"], div[data-testid*="hpto"] {display: none !important;}`;
                document.head.appendChild(e);
            };
            const I = async () => {
                try { await f.putOverridesValues({ pairs: { ads: "0", catalogue: "premium", product: "premium", type: "premium" } }); }
                catch (e) { console.error("adblockify: Failed inside `disableAds` function\n", e); }
            };
            const h = async () => {
                try {
                    const { billboard: e, leaderboard: t, sponsoredPlaylist: i } = r,
                        l = getTestingClient(n.functionModules, f.transport);
                    if (l) l.addPlaytime({ seconds: -1e11 }); else await w.post("sp://ads/v1/testing/playtime", { value: -1e11 });
                    if (await u.disable(), u.isNewAdsNpvEnabled = !1, await e.disable(), await t?.disableLeaderboard(), await i.disable(), r?.inStreamApi) {
                        const { inStreamApi: d } = r;
                        await d.disable();
                    }
                    if (r?.vto) {
                        const { vto: d } = r;
                        await d.manager.disable(), d.isNewAdsNpvEnabled = !1;
                    }
                    setTimeout(I, 100);
                } catch (e) { console.error("adblockify: Failed inside `configureAdManagers` function\n", e); }
            };
            const M = async () => {
                for (const e of m) E(e.slotId || e.slot_id), setTimeout(() => g({ adSlotEvent: { slotId: e.slotId || e.slot_id } }), 50);
            };
            const g = e => {
                const t = e?.adSlotEvent?.slotId;
                try {
                    const i = u?.inStreamApi?.adsCoreConnector;
                    typeof i?.clearSlot == "function" && i.clearSlot(t);
                    const l = getSlotsClient(n.functionModules, f.transport);
                    l && l.clearAllAds({ slotId: t }), C(t);
                } catch (i) {
                    if (console.error("adblockify: Failed inside `handleAdSlot` function. Retrying in 1 second...\n", i), retryCounter(t, "increment"), retryCounter(t, "get") > 5) {
                        console.error(`adblockify: Failed inside \`handleAdSlot\` function for 5th time. Giving up...\nSlot id: ${t}.`);
                        retryCounter(t, "clear");
                        return;
                    }
                    setTimeout(g, 1e3, e);
                }
                h();
            };
            const C = async e => {
                try {
                    const t = getSettingsClient(n.cache, n.functionModules, f.transport);
                    if (!t) return;
                    const i = b[0] === 1 && b[1] >= 2 && b[2] >= 82 ? 0n : "0";
                    await t.updateAdServerEndpoint({ slotIds: [e], url: "http://localhost/no/thanks" }),
                    await t.updateStreamTimeInterval({ slotId: e, timeInterval: i }),
                    await t.updateSlotEnabled({ slotId: e, enabled: !1 }),
                    await t.updateDisplayTimeInterval({ slotId: e, timeInterval: i });
                } catch (t) { console.error("adblockify: Failed inside `updateSlotSettings` function\n", t); }
            };
            const P = async () => { for (const e of m) C(e.slotId || e.slot_id); };
            const E = e => {
                try { u.inStreamApi.adsCoreConnector.subscribeToSlot(e, g); }
                catch (t) { console.error("adblockify: Failed inside `subToSlot` function\n", t); }
            };
            const A = async () => {
                try {
                    const e = JSON.parse(localStorage.getItem("spicetify-exp-features") || "{}");
                    typeof e?.enableEsperantoMigration?.value < "u" && (e.enableEsperantoMigration.value = !0),
                    typeof e?.enableInAppMessaging?.value < "u" && (e.enableInAppMessaging.value = !1),
                    typeof e?.hideUpgradeCTA?.value < "u" && (e.hideUpgradeCTA.value = !0),
                    typeof e?.enablePremiumUserForMiniPlayer?.value < "u" && (e.enablePremiumUserForMiniPlayer.value = !0),
                    localStorage.setItem("spicetify-exp-features", JSON.stringify(e));
                    const t = { enableEsperantoMigration: !0, enableInAppMessaging: !1, hideUpgradeCTA: !0, enablePremiumUserForMiniPlayer: !0 };
                    if (Spicetify.Platform?.RemoteConfigDebugAPI?.getProperties && Spicetify.Platform.RemoteConfigDebugAPI?.setOverride) {
                        const i = Spicetify.Platform.RemoteConfigDebugAPI, l = await i.getProperties();
                        for (const [d, S] of Object.entries(t)) {
                            const p = l.find(y => y?.source === "web" && y?.type === "boolean" && y?.name === d);
                            p && await i.setOverride({ ref: p, value: S }, { autoRunOverrideEffects: p.localValue !== S });
                        }
                    } else if (Spicetify.Platform?.RemoteConfigDebugAPI?.setOverride) {
                        const i = Spicetify.Platform.RemoteConfigDebugAPI;
                        for (const [l, d] of Object.entries(t)) await i.setOverride({ source: "web", type: "boolean", name: l }, d);
                    } else if (Spicetify?.RemoteConfigResolver && typeof Spicetify.createInternalMap == "function") {
                        const i = Spicetify.createInternalMap(t);
                        Spicetify.RemoteConfigResolver.value.setOverrides(i);
                    }
                } catch (e) { console.error("adblockify: Failed inside `enableExperimentalFeatures` function\n", e); }
            };
            M(), k(), f.subValues({ keys: ["ads", "catalogue", "product", "type"] }, () => h()), A(), setTimeout(A, 3e3), setTimeout(P, 5e3);
        })();
    }
    waitForSpicetifyThenRun();
})();
