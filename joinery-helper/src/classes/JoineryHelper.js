import Storage from "./Storage";
import Scan from "./Scan";
import UserInterface from "./UserInterface";
import RedFlags from "./RedFlags";
import Job from './Job'

export default class JoineryHelper {
	#intervalID = null

	constructor(extId) {
		this.updateAppState = false;
		//.extId = extId; //needed to make injected js connectable to extension
		this.appState = {
			"scanSettings": {
				"target": "all",
				"excludedWorkOrders": [],
			},
			"fixSettings": {
				"target": "yellows",
			},
			"flagSettings": {
				"star": true
			},
			"darSettings": {
				"target": "greens"
			},
			"changeLog": [],
			"toBeFixedLog": [], // [ {flagged: true, data...}, {flagged:false, data...}, ... ]
			"toBeDARedLog": [],
			"waitingForJoinery": false,
			"debugMode": false,
		}

		const btnsToSetup = ['scan', 'fix', 'star', 'dar', 'cancel', 'reset', 'report', 'clear']
		const tabsToSetup = ["scan", "fix", "dar", "red-flags", "report", "settings"]
		this.Storage = new Storage()
		this.UI = new UserInterface(this, tabsToSetup, btnsToSetup)
		this.Scan = new Scan()
		this.Job = new Job()
		this.RedFlags = new RedFlags()

	}

	getBtnFunc(name) {
		switch (name) {
			case 'scan':
				return this.scan

			case 'fix':
				return this.fixMeasurements

			case 'star':
				return this.flagHandler

			case 'dar':
				return this.completeDigitalArtReview

			case 'cancel':
				return this.cancel

			case 'reset':
				return this.reset

			case 'report':
				return this.report

			case 'clear':
				return this.clear

			default:
				console.error('button name not found')
		}
	}

	scan() {

		// document.getElementById('jh-excluded').blur();
		this.UI.toggleBlastShield();

		if (this.UI.updateAppState) this.updateState(this.UI.appSettings);

		const state = this.appState
		const rows = this.UI.getRows(state, 'scan')
		const refs = this.UI.refs
		const sendData = nextState => {
			this.Storage.sendDataToStorage(nextState).finally(() => {
				// this.updateState({changeLog: []})
			}).catch(e => {
				if (this.appState.debugMode) console.log(e)
				alert("unable to set data in local storage")
			})
		}
		const callbacks = [
			this.UI.toggleBlastShield.bind(this.UI),
			this.updateState.bind(this), //needs .call?
			sendData.bind(this)
		]

		// this.intervalID = this.Scan.start(rows, refs, state)
		this.intervalID = this.Scan.start(rows, refs, state, callbacks)

	}


	completeDigitalArtReview() {

		if (this.updateAppState) this.updateState();
		const arr = this.getRows(this.appState, 'dar');


		this.workflowTab.click();

		this.jobInterval(arr, (data) => {
			document.querySelector('md-checkbox[aria-label="Digital Art Review"]').click();
		});
	};

	flagHandler() {
		const arr = this.getRows(this.appState, "flags");

		this.jobInterval(arr, () => {

			this.addStars();

		});
	}

	jobInterval(dataArr, func) {

		let counter = 0;
		let setup = true;
		let time = 0;
		let data;
		const bufferTime = 3;
		let bufferCounter = 0;
		this.toggleBlastShield();
		this.intervalID = setInterval(() => {

			let formReady = !this.saveButtonRef.hasAttribute('disabled');
			if (this.appState.debugMode) console.log('form ready: ', formReady);
			if (counter === dataArr.length) {

				clearInterval(this.intervalID);
				this.toggleBlastShield();
				if (this.appState.debugMode) console.log('job done: interval cleared');

			} else {

				if (setup) {
					if (this.appState.debugMode) console.log('starting setup');

					data = dataArr[counter];
					data.row.scrollIntoView({block: "center", behavior: "smooth"});
					data.row.click();
					setup = false;

					if (this.appState.debugMode) console.log('setup: ', data, setup);

				}
				if (!this.appState.waitingForJoinery) {
					if (this.appState.debugMode) console.log('joinery Open!');
					func(data);
					if (this.appState.debugMode) console.log('provided function has run');
					this.appState.waitingForJoinery = true;

				}
				if (formReady) {

					if (bufferCounter < bufferTime) {

						bufferCounter++;

					} else {

						setup = true;
						bufferCounter = 0;
						counter++;

						this.appState.waitingForJoinery = false;

						if (this.appState.debugMode) console.log('done saving');

					}
				}
				if (this.appState.debugMode) console.log(`${time} seconds have passed...`);
				time++;
			}
		}, 1000);
	}

	fixMeasurements() {
		this.fieldsTab.click();
		if (this.updateAppState) this.updateState();
		// const arr = this.appState.toBeFixedLog; //returns [ {data}, ... ]
		const arr = this.getRows(this.appState, "fix"); // returns [ rowElement, ...]
		if (arr.length === 0) {
			if (this.appState.debugMode) console.log("no fixable items");
			return
		}
		//needs [{data}, ...], not [rowElement]

		this.jobInterval(arr, (data) => {

			let modifier = data.isNoMatOrFloat ? 0 : .25;
			this.changeOpeningValues(data.measurements.artWidth, data.measurements.artHeight, modifier);

		}, 3000);
	};


	updateState(newState) {
		/* TODO:
		* 	 alter single settings on change to reduce queries
		*    excludedWorkOrders needs a more robust string manipulation to handle user errors
		* 	 work this in at start of each job perhaps by reworking jobInterval function
		* */
		console.log(newState, 'inside update')
		if (this.appState.debugMode) console.log("updating state");
		this.appState = {
			...this.appState,
			...newState
		}


		if (this.appState.debugMode) console.log("app state after update: ", this.appState);
	}


	cancel() {
		clearTimeout(this.intervalID);
		clearInterval(this.intervalID);
		this.toggleBlastShield();
	}

	addStars() {
		let string = this.workOrderInstructionsRef.value
		if (this.appState.debugMode) console.log('WOI Value: ', string);
		if (string.slice(-3) === "***") return
		if (this.appState.debugMode) console.log("doesn't have stars already");
		this.workOrderInstructionsRef.dispatchEvent(new Event('focus'));
		this.workOrderInstructionsRef.value = string + '***';
		this.workOrderInstructionsRef.dispatchEvent(new Event('change'));
		this.workOrderInstructionsRef.dispatchEvent(new Event('blur'));

		this.saveButtonRef.click();
	}

	changeOpeningValues(width, height, modifier) {
		width -= modifier;
		height -= modifier;
		if (this.appState.debugMode) console.log('change values to: ', width, height);
		this.widthInputRef.dispatchEvent(new Event('focus'));
		this.widthInputRef.value = width;
		this.widthInputRef.dispatchEvent(new Event('change'));
		this.widthInputRef.dispatchEvent(new Event('blur'));
		this.heightInputRef.dispatchEvent(new Event('focus'));
		this.heightInputRef.value = height;
		this.heightInputRef.dispatchEvent(new Event('change'));
		this.heightInputRef.dispatchEvent(new Event('blur'));

		this.saveButtonRef.click();
	}

	async reset() {
		const tableGridRows = document.querySelectorAll(".data-grid-table-row");
		tableGridRows.forEach(row => {
			row.style.removeProperty('background-color');
			row.style.removeProperty('color');
		});
		this.appState.toBeFixedLog = [];
		this.appState.toBeDARedLog = [];
		this.appState.changeLog = [];

	}

	async report() {
		/*	1. any tab can send scanned data error logs
			2. get and combine new errors into master error log file
			3. save new master error log
			4.

			1. report button sends request to local storage
			2. takes response and turns it into csv
			3. immediately downloads master csv

		*/
		console.clear();
		const name = this.user.substring(0, this.user.indexOf("."));
		const date = new Date().toLocaleString('en-us', {hour12: false}).replace(",", "");
		let csvString = 'Date,Workorder,Who,Level,Errors\n';

		console.log('***** CHANGE LOG *****');

		chrome.storage.local.get("joineryHelper").then((res) => {

			Object.keys(res.joineryHelper).forEach(key => {

				csvString += `${date},${key},${name},,"${res.joineryHelper[key].join(', ')}"\n`

			});
			console.log(csvString);
		}).catch(e => console.log("no changes to report"))
			.finally(() => {
					console.log('***** CHANGE LOG END *****');
					const blob = new Blob([csvString], {type: "text/csv"});
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.setAttribute("href", url);
					a.setAttribute("download", "change-log.csv");
					a.click();
					a.remove();
				}
			);


	}


	async clear() {
		this.Storage.clearStorage(this.appState)
	}
}

	// toggleBlastShield() {
	// 	if (this.appState.debugMode) console.log('blast shield toggled', this.blastShieldRef);
	// 	this.appState.blastShield = !this.appState.blastShield
	// 	this.blastShieldRef.classList.toggle("active");
	// 	document.getElementById("jh-in-progress-content").classList.toggle("active")
	// 	document.querySelector(".jh-content .selected").classList.toggle("loading");
	// }


