function getPreviousTab(tabs) {
    return tabs.reduce(
        (prev, current) => {
            return prev.lastAccessed > current.lastAccessed ? prev : current;
        }
    )
}

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface

// given a tab that is expected to update its url, applies
function waitForTabUrlChange(matchTabId, matchWindowId, oldCI, newTabId, changeInfo, tabInfo) {
    // console.log(matchTabId, oldCI, newTabId, changeInfo, tabInfo);
    // console.log(browser.tabs.onUpdated.hasListener(waitForTabUrlChange));
    if (changeInfo.url && newTabId == matchTabId && matchWindowId == tabInfo.windowId) {
        browser.tabs.remove(newTabId);
        browser.tabs.create({url: changeInfo.url, cookieStoreId: oldCI});
    }
}

browser.tabs.onCreated.addListener(async (newTab) => {
    const newCI = newTab.cookieStoreId;

    // let users create new tabs in new container
    if (newCI != "firefox-default") {
        return;
    }

    const oldTab = getPreviousTab(await browser.tabs.query({windowId: newTab.windowId, active: false}));
    const oldCI = oldTab.cookieStoreId;

    // allows for new tabs created outside of firefox to work
    if (newTab.active == false && newCI != oldCI) {
        browser.tabs.onUpdated.addListener(waitForTabUrlChange.bind(null, newTab.id, newTab.windowId, oldCI));
        return;
    }

    // allows for new tabs to created in the default container when creating a new tab on the home page
    if (oldTab.url == "about:newtab") {
        return;
    }

    if (newCI != oldCI) {
        browser.tabs.remove(newTab.id);
        browser.tabs.create({cookieStoreId: oldCI});
    }
});

// browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tabInfo) => {
//     if (changeInfo.url) {
//         console.log("changed tab %d's url to %s", tabId, changeInfo.url)
//     };
// })
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface