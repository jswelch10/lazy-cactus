/* this page is for tracking the state of the app across multiple tabs and eventually merging them in storage and dispersing updated info */
let initialized = false;
let appElement;

chrome.runtime.onStartup.addListener(() => {
	console.log('on start log');
	chrome.action.setBadgeText({
		text: "OFF",
	})
	//TODO: remove stored data that is older than a week on startup
	console.log('app button clicked');
	//add listener to chrome.storage.onChanged to potentially update changeLog master list
});


chrome.action.onClicked.addListener((tab) => {
	if(!initialized) {
		chrome.action.setBadgeBackgroundColor(
			{color: '#00FF00'}, //green
		);
		chrome.action.setBadgeText({text: "ON"});
		chrome.scripting.executeScript({
			target: {tabId: tab.id},
			files: ['JoineryHelper.js']
		});
		initialized = true;
	}
});