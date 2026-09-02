(function () {
  "use strict";

  // ========== 1. Network Ad Blocking (fetch + XHR) ==========
  const AD_PATTERNS = [
    /ads\.spotify\.com/,
    /ad-[\w]+\.spotify\.com/,
    /audio-ak-spotify\.com\/ad/,
    /spclient\.wg\.spotify\.com\/ad/,
    /doubleclick\.net/,
  ];

  const origFetch = window.fetch;
  window.fetch = function (...args) {
    const url = args[0];
    if (typeof url === "string" && AD_PATTERNS.some((p) => p.test(url))) {
      return Promise.reject(new Error("Ad blocked"));
    }
    return origFetch.apply(this, args);
  };

  const origXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (typeof url === "string" && AD_PATTERNS.some((p) => p.test(url))) {
      this.abort();
      return;
    }
    return origXHROpen.call(this, method, url, ...rest);
  };

  // ========== 2. Premium Spoof ==========
  function spoofPremium() {
    try {
      localStorage.setItem(
        "spicetify-exp-features",
        JSON.stringify({
          enableEsperantoMigration: true,
          enableInAppMessaging: false,
          hideUpgradeCTA: true,
          enablePremiumUserForMiniPlayer: true,
        })
      );
      sessionStorage.setItem("premium", "true");
      document.cookie = "premium=true; path=/";
    } catch (e) {}
  }
  spoofPremium();

  // ========== 3. CSS to hide ad elements ==========
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

  // ========== 4. Remove ad elements dynamically ==========
  function cleanAds() {
    document.querySelectorAll([
      '[data-testid="context-item-info-ads"]',
      '[data-testid*="ad-slot"]',
      '[data-testid*="hpto"]',
      ".main-leaderboardComponent-container",
      ".sponsor-container",
      'div[class*="LeaderboardAd"]',
      'div[class*="BillboardAd"]',
      'iframe[src*="doubleclick"]',
      'iframe[src*="googlesyndication"]',
      'a[href^="https://www.spotify.com/premium/"]',
      ".upgrade-button",
      ".main-topBar-UpgradeButton",
      '.main-contextMenu-menuItem a[href*="premium"]',
    ]).forEach((el) => el.remove());
  }

  const observer = new MutationObserver(cleanAds);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(cleanAds, 2000);

  // ========== 5. Badge (text only) ==========
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
      gap: "6px",
    });
    const text = document.createTextNode("NovaLuna.cc");
    badge.appendChild(text);
    const append = () => {
      if (document.body) document.body.appendChild(badge);
      else requestAnimationFrame(append);
    };
    append();
  })();

  // ========== 6. Player Ad Patching ==========
  function patchPlayer() {
    let player =
      window.Spotify?.Player ||
      window?.spicetify?.Player ||
      document.querySelector("audio")?.__reactInternalInstance$?.return?.stateNode
        ?.props?.player;

    if (!player) {
      setTimeout(patchPlayer, 500);
      return;
    }

    if (player.playAd) {
      const origPlayAd = player.playAd;
      player.playAd = function (ad) {
        console.log("[patcher] Skipping ad:", ad);
        this.skipAd ? this.skipAd() : this.nextTrack();
        return Promise.resolve();
      };
    }
    if (player.loadAd) {
      player.loadAd = function () {
        console.log("[patcher] Ad load blocked");
        return Promise.resolve({});
      };
    }

    if (player._adManager) {
      const mgr = player._adManager;
      mgr.loadAd = () => Promise.resolve();
      mgr.playAd = () => Promise.resolve();
      mgr.skipAd = () => Promise.resolve();
      mgr.isAdPlaying = () => false;
    }

    if (player._state) {
      Object.defineProperty(player._state, "isAdPlaying", {
        get: () => false,
        set: () => {},
      });
    }

    console.log("[patcher] Player patched");
  }
  setTimeout(patchPlayer, 1000);

  // ========== 7. Deep Adblockify (Spicetify/Webpack based) ==========
  function initAdblockify() {
    // Wait for Spicetify or necessary objects
    const checkReady = () => {
      if (window.Spicetify && window.Spicetify.Events) {
        // Use Spicetify events if available
        runAdblockify();
      } else if (window.webpackChunkclient_web || window.rspackChunkclient_web) {
        // Fallback: just try to load webpack directly
        runAdblockify();
      } else {
        setTimeout(checkReady, 1000);
      }
    };
    checkReady();

    function runAdblockify() {
      console.log("[patcher] Running deep adblockify");

      // ===== copied from adblockify =====
      const waitFor = async (fn, interval = 50, attempts = 20) => {
        for (let i = 0; i < attempts; i++) {
          const res = fn();
          if (res !== undefined) return res;
          await new Promise((r) => setTimeout(r, interval));
        }
        return fn();
      };

      const getChunkQueue = () =>
        window?.webpackChunkclient_web || window?.rspackChunkclient_web;

      const loadWebpack = async () => {
        try {
          const queue = await waitFor(getChunkQueue, 50);
          if (!queue) throw new Error("No webpack queue");
          const push = queue.push([[Symbol()], {}, (c) => c]);
          const modules = Object.keys(push.m).map((id) => push(id));
          const objects = modules
            .filter((m) => typeof m === "object")
            .flatMap((m) => {
              try {
                return Object.values(m);
              } catch {
                return [];
              }
            });
          const funcs = objects.flatMap((o) => {
            if (typeof o === "function") return [o];
            if (typeof o === "object" && o) {
              return Object.values(o).filter(
                (f) =>
                  typeof f === "function" && !new Set(Object.values(push.m)).has(f)
              );
            }
            return [];
          });
          return { cache: modules, functionModules: funcs };
        } catch (e) {
          console.error("adblockify: loadWebpack failed", e);
          return { cache: [], functionModules: [] };
        }
      };

      const getSettingsClient = (cache, funcs, transport) => {
        try {
          const client = cache.find((m) => m?.settingsClient)?.settingsClient;
          if (client) return client;
          const Settings = funcs.find(
            (m) =>
              m?.SERVICE_ID ===
                "spotify.ads.esperanto.settings.proto.Settings" ||
              m?.SERVICE_ID === "spotify.ads.esperanto.proto.Settings"
          );
          return new Settings(transport);
        } catch (e) {
          console.error("adblockify: getSettingsClient error", e);
          return null;
        }
      };

      const getSlotsClient = (funcs, transport) => {
        try {
          const Slots = funcs.find(
            (m) =>
              m?.SERVICE_ID === "spotify.ads.esperanto.slots.proto.Slots" ||
              m?.SERVICE_ID === "spotify.ads.esperanto.proto.Slots"
          );
          return new Slots(transport);
        } catch (e) {
          console.error("adblockify: getSlotsClient error", e);
          return null;
        }
      };

      const getTestingClient = (funcs, transport) => {
        try {
          const Testing = funcs.find(
            (m) =>
              m?.SERVICE_ID ===
                "spotify.ads.esperanto.testing.proto.Testing" ||
              m?.SERVICE_ID === "spotify.ads.esperanto.proto.Testing"
          );
          return new Testing(transport);
        } catch (e) {
          console.error("adblockify: getTestingClient error", e);
          return null;
        }
      };

      const map = new Map();
      const retryCounter = (slotId, action) => {
        if (!map.has(slotId)) map.set(slotId, { count: 0 });
        if (action === "increment") map.get(slotId).count++;
        else if (action === "clear") map.delete(slotId);
        else if (action === "get") return map.get(slotId)?.count;
      };

      (async function adblockifyMain() {
        // Wait for platform and webpack if Spicetify events exist
        if (window.Spicetify && window.Spicetify.Events) {
          await new Promise((res) =>
            window.Spicetify.Events.platformLoaded.on(res)
          );
          await new Promise((res) =>
            window.Spicetify.Events.webpackLoaded.on(res)
          );
        }

        const webpack = await loadWebpack();
        const { Platform, Locale } = window.Spicetify || {};
        const AdManagers = Platform?.AdManagers;
        if (!AdManagers?.audio || Object.keys(AdManagers).length === 0) {
          // If Spicetify not present, try to get AdManagers from window.Spotify
          if (window.Spotify?.AdManagers) {
            // Use that
          } else {
            setTimeout(adblockifyMain, 500);
            return;
          }
        }

        const audio = AdManagers.audio;
        const UserAPI = Platform?.UserAPI;
        const productState =
          UserAPI?._product_state ||
          UserAPI?._product_state_service ||
          Platform?.ProductStateAPI?.productStateApi;

        const version = Platform?.version
          ?.split(".")
          .map(Number) || [1, 2, 0];
        const CosmosAsync = window.Spicetify?.CosmosAsync;

        let slots = [];
        const slotsClient = getSlotsClient(
          webpack.functionModules,
          productState?.transport
        );
        if (slotsClient) {
          slots = (await slotsClient.getSlots()).adSlots;
        } else if (CosmosAsync) {
          try {
            slots = await CosmosAsync.get("sp://ads/v1/slots");
          } catch {
            setTimeout(adblockifyMain, 500);
            return;
          }
        } else {
          setTimeout(adblockifyMain, 500);
          return;
        }

        // Hide ad-like elements via CSS (already done, but add extra classes)
        const hideCss = () => {
          const css = document.createElement("style");
          css.className = "adblockify";
          const upgradeText = Locale?.get?.("upgrade.tooltip.title") || "";
          css.innerHTML = `
            .ScclvBC0NsMgQLQC, .Mvhjv8IKLGjQx94MVOgP, .sl_aPp6GDg05ItSfmsS7,
            .nHCJskDZVlmDhNNS9Ixv, .utUDWsORU96S7boXm2Aq, .cpBP3znf6dhHLA2dywjy,
            .G7JYBeU1c2QawLyFs5VK, .vYl1kgf1_R18FCmHgdw2, .vZkc6VwrFz0EjVBuHGmx,
            .iVAZDcTm1XGjxwKlQisz, ._I_1HMbDnNlNAaViEnbp, .xXj7eFQ8SoDKYXy6L3E1,
            .F68SsPm8lZFktQ1lWsQz, .MnW5SczTcbdFHxLZ_Z8j, .WiPggcPDzbwGxoxwLWFf,
            .ReyA3uE3K7oEz7PTTnAn, .x8e0kqJPS0bM4dVK7ESH, .gZ2Nla3mdRREDCwybK6X,
            .SChMe0Tert7lmc5jqH01, .AwF4EfqLOIJ2xO7CjHoX, .UlkNeRDFoia4UDWtrOr4,
            .k_RKSQxa2u5_6KmcOoSw, ._mWmycP_WIvMNQdKoAFb, .O3UuqEx6ibrxyOJIdpdg,
            .akCwgJVf4B4ep6KYwrk5, .bIA4qeTh_LSwQJuVxDzl, .ajr9pah2nj_5cXrAofU_,
            .gvn0k6QI7Yl_A0u46hKn, .obTnuSx7ZKIIY1_fwJhe, .IiLMLyxs074DwmEH4x5b,
            .RJjM91y1EBycwhT_wH59, .mxn5B5ceO2ksvMlI1bYz, .l8wtkGVi89_AsA3nXDSR,
            .Th1XPPdXMnxNCDrYsnwb, .SJMBltbXfqUiByDAkUN_, .Nayn_JfAUsSO0EFapLuY,
            .YqlFpeC9yMVhGmd84Gdo, .HksuyUyj1n3aTnB4nHLd, .DT8FJnRKoRVWo77CPQbQ,
            ._Cq69xKZBtHaaeMZXIdk, .main-leaderboardComponent-container,
            .sponsor-container, a.link-subtle.main-navBar-navBarLink.GKnnhbExo0U9l7Jz2rdc,
            button[title="${upgradeText}"], button[aria-label="${upgradeText}"],
            .main-topBar-UpgradeButton,
            .main-contextMenu-menuItem a[href^="https://www.spotify.com/premium/"],
            div[data-testid*="hpto"] { display: none !important; }
          `;
          document.head.appendChild(css);
        };
        hideCss();

        // Disable ads via productState
        const disableAds = async () => {
          if (productState?.putOverridesValues) {
            await productState.putOverridesValues({
              pairs: {
                ads: "0",
                catalogue: "premium",
                product: "premium",
                type: "premium",
              },
            });
          }
        };

        // Configure AdManagers
        const configureAdManagers = async () => {
          try {
            const { billboard, leaderboard, sponsoredPlaylist } = AdManagers;
            const testing = getTestingClient(
              webpack.functionModules,
              productState?.transport
            );
            if (testing) {
              await testing.addPlaytime({ seconds: -100000000000 });
            } else if (CosmosAsync) {
              await CosmosAsync.post("sp://ads/v1/testing/playtime", {
                value: -100000000000,
              });
            }

            await audio.disable();
            audio.isNewAdsNpvEnabled = false;
            if (billboard) await billboard.disable();
            if (leaderboard?.disableLeaderboard)
              await leaderboard.disableLeaderboard();
            if (sponsoredPlaylist) await sponsoredPlaylist.disable();
            if (AdManagers.inStreamApi) {
              await AdManagers.inStreamApi.disable();
            }
            if (AdManagers.vto) {
              await AdManagers.vto.manager.disable();
              AdManagers.vto.isNewAdsNpvEnabled = false;
            }
            setTimeout(disableAds, 100);
          } catch (e) {
            console.error("adblockify: configureAdManagers error", e);
          }
        };

        // Handle slot events
        const handleAdSlot = (data) => {
          const slotId = data?.adSlotEvent?.slotId;
          try {
            const core = audio?.inStreamApi?.adsCoreConnector;
            if (core?.clearSlot) core.clearSlot(slotId);
            const client = getSlotsClient(
              webpack.functionModules,
              productState?.transport
            );
            if (client) client.clearAllAds({ slotId });
            updateSlotSettings(slotId);
          } catch (e) {
            console.error("adblockify: handleAdSlot error", e);
            retryCounter(slotId, "increment");
            if (retryCounter(slotId, "get") > 5) {
              retryCounter(slotId, "clear");
              return;
            }
            setTimeout(handleAdSlot, 1000, data);
          }
          configureAdManagers();
        };

        const updateSlotSettings = async (slotId) => {
          try {
            const client = getSettingsClient(
              webpack.cache,
              webpack.functionModules,
              productState?.transport
            );
            if (!client) return;
            const timeInterval =
              version[0] === 1 && version[1] >= 2 && version[2] >= 82
                ? 0n
                : "0";
            await client.updateAdServerEndpoint({
              slotIds: [slotId],
              url: "http://localhost/no/thanks",
            });
            await client.updateStreamTimeInterval({ slotId, timeInterval });
            await client.updateSlotEnabled({ slotId, enabled: false });
            await client.updateDisplayTimeInterval({ slotId, timeInterval });
          } catch (e) {
            console.error("adblockify: updateSlotSettings error", e);
          }
        };

        const subToSlot = (slot) => {
          try {
            audio.inStreamApi.adsCoreConnector.subscribeToSlot(
              slot,
              handleAdSlot
            );
          } catch (e) {
            console.error("adblockify: subToSlot error", e);
          }
        };

        // Bind to slots
        for (const slot of slots) {
          const id = slot.slotId || slot.slot_id;
          subToSlot(id);
          setTimeout(() => handleAdSlot({ adSlotEvent: { slotId: id } }), 50);
        }

        // Enable experimental features
        const enableExpFeatures = async () => {
          try {
            const exp = JSON.parse(
              localStorage.getItem("spicetify-exp-features") || "{}"
            );
            Object.assign(exp, {
              enableEsperantoMigration: true,
              enableInAppMessaging: false,
              hideUpgradeCTA: true,
              enablePremiumUserForMiniPlayer: true,
            });
            localStorage.setItem("spicetify-exp-features", JSON.stringify(exp));

            const overrides = {
              enableEsperantoMigration: true,
              enableInAppMessaging: false,
              hideUpgradeCTA: true,
              enablePremiumUserForMiniPlayer: true,
            };

            if (Platform?.RemoteConfigDebugAPI?.setOverride) {
              const api = Platform.RemoteConfigDebugAPI;
              if (api.getProperties) {
                const props = await api.getProperties();
                for (const [key, val] of Object.entries(overrides)) {
                  const ref = props.find(
                    (p) =>
                      p?.source === "web" &&
                      p?.type === "boolean" &&
                      p?.name === key
                  );
                  if (ref) {
                    await api.setOverride(
                      { ref, value: val },
                      { autoRunOverrideEffects: ref.localValue !== val }
                    );
                  }
                }
              } else {
                for (const [key, val] of Object.entries(overrides)) {
                  await api.setOverride(
                    { source: "web", type: "boolean", name: key },
                    val
                  );
                }
              }
            }
          } catch (e) {
            console.error("adblockify: enableExpFeatures error", e);
          }
        };

        configureAdManagers();
        if (productState?.subValues) {
          productState.subValues(
            { keys: ["ads", "catalogue", "product", "type"] },
            configureAdManagers
          );
        }
        enableExpFeatures();
        setTimeout(enableExpFeatures, 3000);

        // Update slot settings periodically
        setTimeout(async () => {
          for (const slot of slots) {
            updateSlotSettings(slot.slotId || slot.slot_id);
          }
        }, 5000);
      })();
    }
  }

  // ========== 8. SectionBlock (fetch interceptor for homepage) ==========
  // This will intercept pathfinder and personalized recommendations to remove ad sections
  const API_PATHFINDER = "api-partner.spotify.com/pathfinder";
  const API_RECOMMENDATIONS =
    "api.spotify.com/v1/views/personalized-recommendations";

  const BLOCKED_SECTIONS_BY_CATEGORY = {
    Party: ["0JQ5DAnM3wGh0gz1MXnul1"],
    Chill: ["0JQ5DAnM3wGh0gz1MXnukV"],
    "Best of the Year": ["0JQ5IMCbQBLupUQrQFeCzx"],
    "Best of Artists / Tracks": ["0JQ5DAnM3wGh0gz1MXnu3C"],
    "Best of songwriters": ["0JQ5DAnM3wGh0gz1MXnu4w"],
    "Biggest Indie Playlists": ["0JQ5IMCbQBLhSb02SGYpDM"],
    Charts: ["0JQ5DAnM3wGh0gz1MXnu5g"],
    Dinner: ["0JQ5DAnM3wGh0gz1MXnu3p"],
    "Featured Charts": ["0JQ5DAob0KOew1FBAMSmBz"],
    Focus: ["0JQ5DAob0JCuWaGLU6ntFY", "0JQ5DAnM3wGh0gz1MXnulP"],
    "Fresh new music": ["0JQ5DAnM3wGh0gz1MXnu3s"],
    "Gaming music": ["0JQ5DAob0LaV9FOMJ9utY5"],
    Happy: ["0JQ5DAnM3wGh0gz1MXnu3q"],
    "ICE PHONK": ["0JQ5IMCbQBLiqrNCH9VvmA"],
    Mood: ["0JQ5DAnM3wGh0gz1MXnucG", "0JQ5DAob0JCuWaGLU6ntFT"],
    "Most Listened 2023": ["0JQ5IMCbQBLicmNERjnGn5"],
    "Music to game to": ["0JQ5DAob0Jr9ClCbkV4pZD"],
    "Popular Albums / Artists": ["0JQ5DAnM3wGh0gz1MXnu3B"],
    "Popular new releases": ["0JQ5DAnM3wGh0gz1MXnu3D"],
    "Popular radio": ["0JQ5DAnM3wGh0gz1MXnu4h"],
    Sad: ["0JQ5DAnM3wGh0gz1MXnu3u", "0JQ5DAnM3wGh0gz1MXnul2"],
    Throwback: ["0JQ5DAnM3wGh0gz1MXnu3w", "0JQ5DAnM3wGh0gz1MXnul4"],
    "Throwback Thursday / Spotify Playlists / Good night ": [
      "0JQ5DAuChZYPe9iDhh2mJz",
    ],
    "Today`s biggest hits": ["0JQ5DAnM3wGh0gz1MXnu3M"],
    "Trending now": ["0JQ5DAnM3wGh0gz1MXnu3E"],
    Workout: ["0JQ5DAnM3wGh0gz1MXnu3x", "0JQ5DAnM3wGh0gz1MXnul6"],
    "Now defrosting": ["0JQ5IMCbQBLlC31GvtaB6w"],
    Unknown: ["0JQ5IMCbQBLqTJyy28YCa9", "0JQ5DAnM3wGh0gz1MXnu7R"],
  };

  const BLOCKED_SECTIONS = {};
  for (const [category, ids] of Object.entries(BLOCKED_SECTIONS_BY_CATEGORY)) {
    for (const id of ids) {
      BLOCKED_SECTIONS[id] = category;
    }
  }
  const BLOCKED_CONTENT_TYPES = new Set(["Podcast", "Audiobook", "Episode"]);

  function createSectionAdapter(isPersonalized) {
    if (isPersonalized) {
      return {
        getId: (item) => {
          const href = item?.href;
          if (!href) return null;
          const parts = href.split("/");
          let id = parts[parts.length - 1];
          if (id.startsWith("section")) id = id.substring(7);
          return id;
        },
        getTitle: (item) => item?.content?.name || "Unknown",
        getRef: (item) => item?.href,
        getSectionId: (item) => item?.id,
        getContentItems: (item) => item?.content?.items,
        getContentData: (contentItem) => contentItem?.content,
        getContentType: (contentItem) => contentItem?.type,
        getContentTypeName: (contentItem) => contentItem?.content_type,
      };
    } else {
      return {
        getId: (item) => {
          const uri = item?.uri;
          if (!uri) return null;
          const parts = uri.split(":");
          return parts[parts.length - 1];
        },
        getTitle: (item) => item?.data?.title?.text || "Unknown",
        getRef: (item) => item?.uri,
        getSectionId: () => null,
        getContentItems: (item) => item?.sectionItems?.items,
        getContentData: (contentItem) => contentItem?.content?.data,
        getContentType: () => null,
        getContentTypeName: () => null,
      };
    }
  }

  function sectionBlock(data, type) {
    const body = data?.data?.home;
    const sections = body?.sectionContainer?.sections?.items;
    const items = data?.content?.items || data?.data?.content?.items;
    const isPersonalized = !!items && !body;
    const targetArray = isPersonalized ? items : sections;

    function removeSections() {
      if (!targetArray?.length) return;
      const adapter = createSectionAdapter(isPersonalized);
      const removed = [];
      for (let i = targetArray.length - 1; i >= 0; i--) {
        const item = targetArray[i];
        const sectionId = adapter.getId(item);
        if (!sectionId) continue;
        if (sectionId in BLOCKED_SECTIONS) {
          removed.push({
            id: sectionId,
            knownAs: BLOCKED_SECTIONS[sectionId],
            actualTitle: adapter.getTitle(item),
            ref: adapter.getRef(item),
          });
          targetArray.splice(i, 1);
        }
      }
      if (removed.length > 0) {
        console.log(
          `[SectionBlock] Removed ${removed.length} blocked section(s):`,
          removed
        );
      }
    }

    function removePodcasts() {
      if (!targetArray?.length) return;
      const adapter = createSectionAdapter(isPersonalized);
      const removed = [];
      for (let i = targetArray.length - 1; i >= 0; i--) {
        const item = targetArray[i];
        const contentItems = adapter.getContentItems(item);
        if (isPersonalized) {
          const sectionId = adapter.getSectionId(item);
          if (sectionId === "shortcuts") {
            if (!contentItems?.length) continue;
            for (let j = contentItems.length - 1; j >= 0; j--) {
              const ci = contentItems[j];
              const ct = adapter.getContentTypeName(ci);
              if (ct === "PODCAST_EPISODE" || ct === "AUDIOBOOK") {
                removed.push({
                  type: ct,
                  name: ci?.name || "Unknown",
                  uri: ci?.uri || "N/A",
                });
                contentItems.splice(j, 1);
              }
            }
            continue;
          }
          if (
            contentItems?.length &&
            adapter.getContentType(contentItems[0]) === "show"
          ) {
            removed.push({
              type: "PodcastSection",
              sectionId,
              sectionName: adapter.getTitle(item),
              itemsCount: contentItems.length,
            });
            targetArray.splice(i, 1);
            continue;
          }
        }
        if (!contentItems?.length) continue;
        for (let j = contentItems.length - 1; j >= 0; j--) {
          const cd = adapter.getContentData(contentItems[j]);
          if (!cd || !BLOCKED_CONTENT_TYPES.has(cd.__typename)) continue;
          removed.push({
            type: cd.__typename,
            name: cd.name || "Unknown",
            uri: cd.uri || "N/A",
          });
          contentItems.splice(j, 1);
        }
      }
      if (removed.length > 0) {
        console.log(
          `[SectionBlock] Removed ${removed.length} podcast/audiobook item(s):`,
          removed
        );
      }
    }

    function removeCanvasSections() {
      if (!sections?.length) return;
      const removed = [];
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i]?.data?.__typename === "HomeFeedBaselineSectionData") {
          removed.push({
            uri: sections[i]?.uri || "N/A",
            title: sections[i]?.data?.title?.text || "Canvas Section",
          });
          sections.splice(i, 1);
        }
      }
      if (removed.length > 0) {
        console.log(
          `[SectionBlock] Removed ${removed.length} canvas section(s):`,
          removed
        );
      }
    }

    if ((body?.greeting && sections) || items) {
      const actions = {
        section: removeSections,
        podcast: removePodcasts,
        canvas: removeCanvasSections,
        all: () => {
          removeSections();
          removePodcasts();
          if (!isPersonalized) removeCanvasSections();
        },
      };
      if (Array.isArray(type)) {
        type.forEach((t) => actions[t]?.());
      } else {
        actions[type]?.();
      }
    }
  }

  // Override fetch to include sectionBlock interception
  const origFetch2 = window.fetch;
  window.fetch = async function (...args) {
    const [url] = args;
    const urlString = typeof url === "string" ? url : url?.url || "";

    const isPathfinder = urlString.includes(API_PATHFINDER);
    const isRecs = urlString.includes(API_RECOMMENDATIONS);

    if (!isPathfinder && !isRecs) {
      return origFetch2.apply(this, args);
    }

    const response = await origFetch2.apply(this, args);
    const clone = response.clone();

    try {
      const data = await response.json();
      const shouldModify =
        (isPathfinder && data?.data?.home) ||
        (isRecs && data?.content);
      if (shouldModify) {
        sectionBlock(data, "");
        return new Response(JSON.stringify(data), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }
      return clone;
    } catch (e) {
      console.error("Fetch intercept error:", e);
      return clone;
    }
  };

  // ========== 9. Start deep adblockify ==========
  setTimeout(initAdblockify, 2000);
})();
