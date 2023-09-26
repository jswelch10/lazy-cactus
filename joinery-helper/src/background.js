/* this page is for tracking the state of the app across multiple tabs and eventually merging them in storage and dispersing updated info */
let badgeText = '';
async function badgeSettings(text, color, tabId) {

	if(text) {
		chrome.action.setBadgeText({tabId, text});
		badgeText = text;
	}
	if(color) chrome.action.setBadgeBackgroundColor({tabId, color});
}
chrome.action.disable();

chrome.runtime.onStartup.addListener(() => {

	chrome.identity.getProfileUserInfo({accountStatus: 'ANY'},(userInfo) => {
		chrome.storage.local.set({"user": userInfo.email});
	})

	chrome.storage.local.set({"joineryHelper": {}});
});

let initialized = {}
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if(initialized[tab.id] === true) initialized[tab.id] = false;
	if(changeInfo.status === "complete") {

		if(tab.url.indexOf("framebridge.com/joinery") !== -1) {

			chrome.action.enable(tabId);
			badgeSettings("OFF","#FF0000");
		} else {
			chrome.action.disable(tabId);
		}
	}
})



chrome.action.onClicked.addListener((tab) => {
	if(!initialized[tab.id]) {
		badgeSettings("ON","#00FF00", tab.id);
		chrome.scripting.executeScript({
			target: {tabId: tab.id},
			files: ['app.js']
		});
		initialized[tab.id] = true;
	}

});