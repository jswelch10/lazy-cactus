/* this page is for tracking the state of the app across multiple tabs and eventually merging them in storage and dispersing updated info */
let initialized = false;
let hidden = false;
let appElement;
console.log("init", initialized);
/*
	TODO:
	 currently joinery is only able to be loaded once, unless the extension is updated
	 remove stored data that is older than a week on startup
	 Gather user's name from signed in profile and set as user for logged items
	 manage state of icon based on (i'm assuming chrome "messages") and app state
	 */

chrome.runtime.onStartup.addListener(() => {
	console.log('on start log');
	chrome.action.setBadgeText({
		text: "OFF",
	})


	console.log('app button clicked');
	//add listener to chrome.storage.onChanged to potentially update changeLog master list
});


chrome.action.onClicked.addListener((tab) => {
	/*
	* if off, click inits & turns to ON
	* if app is running set banner to BUSY
	* if app is doing nothing, banner to ON
	* if app is hidden, banner to IDLE
	* if it's not an appropriate page, banner is OFF
	* */

	if(!initialized) {
		console.log("first pass init");
		chrome.action.setBadgeBackgroundColor(
			{color: '#00FF00'}, //green
		);
		// TODO: check url on button press, to make sure joineryHelper doesn't run on wrong page
		chrome.scripting.executeScript({
			target: {tabId: tab.id},
			files: ['JoineryHelper.js', 'app.js']
		});
		// appElement = document.getElementById("joineryHelper");
		initialized = true;
		return
	}
	if(chrome.action.getBadgeText(tab.id) === "ON") {
		chrome.action.setBadgeBackgroundColor(
			{color: '#FF0000'}, //red
		);
		chrome.action.setBadgeText({text:"OFF"});
		appElement.style.display = "none";
	} else {
		chrome.action.setBadgeBackgroundColor(
			{color: '#00FF00'}, //green
		);
		chrome.action.setBadgeText({text:"ON"});
		appElement.style.display = "grid";
	}

});
/*
* TODO:
*  setup connection to listen for state changes and collect log data
*  additionally, generating a csv should gather all collected log data either from storage or individual instances of the extension
* */