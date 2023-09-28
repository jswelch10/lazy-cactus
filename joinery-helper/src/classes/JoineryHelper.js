import Storage from "./Storage";
import Scan from "./Scan";
import UserInterface from "./UserInterface";
import Job from './Job'

export default class JoineryHelper {
	#intervalID = null

	constructor() {
		this.updateAppState = false;
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
		this.Job = null

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

	fixMeasurements() {
		const callback = this.prepJob('fix')
		this.Job.fix(callback)
	};

	flagHandler() {
		const callback = this.prepJob('flags')
		this.Job.addStars(callback)
	}

	completeDigitalArtReview() {
		const callback = this.prepJob('dar')
		this.Job.dar(callback)
	}

	updateState(newState) {
		if (this.appState.debugMode) console.log("updating state");
		this.appState = {
			...this.appState,
			...newState
		}
		if (this.appState.debugMode) console.log("app state after update: ", this.appState);
	}

	cancel() {
		clearTimeout(this.intervalID);
		clearInterval(this.Job.id);
		this.Job = undefined
		this.UI.toggleBlastShield();
	}

	prepJob(tabName) {
		this.UI.toggleBlastShield()

		if (this.UI.updateAppState) this.updateState(this.UI.appSettings)

		const state = this.appState
		const rows = this.UI.getRows(this.appState, tabName);
		const refs = this.UI.refs
		if (rows.length === 0) {
			if (this.appState.debugMode) console.log("no applicable item to work on");
			return
		}

		this.Job = new Job(state, rows, refs)
		const intervalEndCallback = () => {
			this.Job = null
			this.UI.toggleBlastShield()
		}
		return intervalEndCallback.bind(this)

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

		await this.Storage.exportAndLogStorage()

	}

	async clear() {
		await this.Storage.clearStorage(this.appState)
	}
}


