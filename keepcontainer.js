function getPreviousTab(tabs) {
    return tabs.reduce(
        (prev, current) => {
            return prev.lastAccessed > current.lastAccessed ? prev : current;
        }
    )
}

// given a tab, waits for its url to update (usually from about:newpage) and then open in the last used container
function waitForTabUrlChange(matchTabId, matchWindowId, oldCI, newTabId, changeInfo, tabInfo) {
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

    const prevTab = getPreviousTab(await browser.tabs.query({windowId: newTab.windowId, active: false}));
    const prevCI = prevTab.cookieStoreId;

    // allows for new tabs created outside of firefox to work
    if (newTab.active == false && newCI != prevCI) {
        browser.tabs.onUpdated.addListener(waitForTabUrlChange.bind(null, newTab.id, newTab.windowId, prevCI));
        return;
    }

    // allows for new tabs to created in the default container when creating a new tab on the home page
    if (prevTab.url == "about:newtab") {
        return;
    }

    if (newCI != prevCI) {
        browser.tabs.remove(newTab.id);
        browser.tabs.create({cookieStoreId: prevCI});
    }
});