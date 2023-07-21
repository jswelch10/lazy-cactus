/* this page is for tracking the state of the app across multiple tabs and eventually merging them in storage and dispersing updated info */
console.log("background.js loaded");
let badgeText = '';
async function badgeSettings(text, color, tabId) {
	console.log(text,color,tabId);
	if(text) {
		chrome.action.setBadgeText({tabId, text});
		badgeText = text;
	};
	if(color) chrome.action.setBadgeBackgroundColor({tabId, color});
	// if(!color && !text) {
	// 	let data = {}
	// 	chrome.action.getBadgeText(tabId).then((e) => {
	// 		data.text = e;
	// 		chrome.action.getBadgeBackgroundColor(tabId).then((f) => {
	// 			data.color = f;
	// 		}).finally(() => data);
	// 	})
	//
	//
	// 	return {text:chrome.action.getBadgeText(tabId), color:}}
}
chrome.action.disable();

chrome.runtime.onStartup.addListener(() => { // only triggers when chrome starts fresh
	console.log('on first start');
	// this stores the current user email in storage under "user"
	chrome.identity.getProfileUserInfo({accountStatus: 'ANY'})
		.then((userInfo) => {
			console.log(userInfo); // returns {email:xyz, id:abc}
			chrome.storage.local.set({"user": userInfo.email});
		});

	//add listener to chrome.storage.onChanged to potentially update changeLog master list
});
/*
	TODO:
	 currently joinery is only able to be loaded once, unless the extension is updated
	 remove stored data that is older than a week on startup
	 manage state of icon based on (i'm assuming chrome "messages") and app state
 */
let initialized = {}
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if(initialized[tab.id] === true) initialized[tab.id] = false;;
	if(changeInfo.status === "complete") {
		console.log(tab.url);
		if(tab.url.indexOf("framebridge.com/joinery") !== -1) {
			console.log("enable");
			chrome.action.enable(tabId);
			badgeSettings("OFF","#FF0000");
		} else {
			console.log("disable");
			chrome.action.disable(tabId);
		}
	}
})



chrome.action.onClicked.addListener((tab) => {
	console.log("button pressed");
	chrome.storage.local.get("user").then(e => console.log(e));
	/*
	*	TODO: possible to switch js from injected to content script
	*/
	if(!initialized[tab.id]) {
		console.log("app injecting and initializing");
		badgeSettings("ON","#00FF00", tab.id);
		chrome.scripting.executeScript({
			target: {tabId: tab.id},
			files: ['JoineryHelper.js', 'app.js']
		});
		initialized[tab.id] = true;
	}
	// if(badgeText === "ON") {
	// 	badgeSettings("IDLE","#0000FF", tab.id);
	// 	//hide app
	// } else {
	// 	badgeSettings("ON","#00FF00", tab.id);
	// 	chrome.storage.local.get("user").then(e => console.log(e));
	// 	//display app as flex
	// }

});
chrome.runtime.onMessage.addListener(
	(message, sender, res)  => { //2
	console.log("onMessage: ", message, "from: ", sender);
	res("loud and clear"); //3
});


chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse)=>{
	console.log("Received message from "+ sender +": ", request);
	sendResponse({received: true});
})
/*
	* if app is running set banner to BUSY
	* if app is doing nothing, banner to ON
	* if app is hidden, banner to IDLE
	* */
/*
* TODO:
*  setup connection to listen for state changes and collect log data
*  additionally, generating a csv should gather all collected log data either from storage or individual instances of the extension
* */