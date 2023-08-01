 class JoineryHelper {
	constructor(extId) {
		this.updateAppState = false;
		this.extId = extId; //needed to make injected js connectable to extension
		this.appState = {
			"scanSettings": {
				"target": "all",
				"autoFix": false,
				"autoDar": false,
				"excludedWorkOrders": [],
			},
			"fixSettings": {
				"target": "yellows",
				"unsavedNewTab": false,
			},
			"flagSettings" : {
				"star" : true
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



		//updated query based on row   structure:  row.children[9].children[0].classList.includes("ng-hide")
		// .children[9] is the flags column on joinery
		// 0: message   Chat message
		// ...
		// 10: mat dim mismatch   Triangle
		// 11: no mat size mismatch  Square with inside lines

		this.init();
	}
	init() {
		this.setupUI();

		chrome.storage.local.get("user").then(res => {
			this.user = res.user
		});

		this.getPageRefs();

		const setupRow = document.querySelector(".data-grid-table-row");

		//this code is needed to initialize the sidebar for a proper scan
		setupRow.click();
		this.fieldsTab.click();
		setupRow.click();
	}

	setupUI(){
		//stops text input and drag feature from fighting
		document.getElementById('jh-excluded').onmousedown = (e) => e.stopPropagation();

		//catch when settings are changed so we don't read before every action
		const func = this.appStateChanged
		Array.from(document.querySelectorAll("#JoineryHelper input")).forEach( item => {
			item.onchange = func.bind(this);
		});


		this.syncUI();
		this.makeUIDraggable();
	}
	syncUI() {
		//below code syncs up tabs with their content
		const names = [
			"scan",
			"fix",
			"dar",
			"red-flags",
			"report",
			"settings"
		];
		const tabs = Array.from(document.getElementsByClassName('jh-tab-btn'));
		const contents = Array.from(document.getElementsByClassName('jh-tab-content'));

		names.forEach(name => {

			const tab = document.getElementById(`jh-${name}-tab`);
			const content = document.getElementById(`jh-${name}-content`);

			tab.addEventListener("click", () => {
				if(tab.classList.contains('active')) return

				tabs.forEach(item => item.classList.remove("active"));
				contents.forEach(item => item.classList.remove("selected"));

				tab.classList.add("active");
				content.classList.add("selected");

			})
		});

		//connects buttons to class functions

		const btnArr = [
			['scan', this.scan],
			['fix', this.fixMeasurements],
			['star', this.flagHandler],
			['dar', this.completeDigitalArtReview],
			['cancel', this.cancel],
			['reset', this.reset],
			['report', this.report]
		];

		btnArr.forEach( ([btnName, func]) => {
			const btn = document.getElementById(`jh-${btnName}Btn`)

			btn.onclick = func.bind(this);
		})

	}

	scan() {
		document.getElementById('jh-excluded').blur();
		this.toggleBlastShield();

		if(this.updateAppState) this.updateState();
		// done as an interval to ensure blast shield and state changes are handled first
		this.intervalID = setTimeout(() => {
			const rows = this.getRows(this.appState, 'scan');
			const max = rows.length;
			rows.forEach( (row, index, array) => {
				if (this.appState.debugMode) console.log(`item ${index+1}/${max}`);
				row.click();

				const workOrderNum = this.workOrderNumRef.innerHTML;
				const changeLogData = {
					workOrderNum,
					fixes: []
				}
				row.dataset.workorderNum = workOrderNum;
				let isSkip = false
				if(this.appState.scanSettings.excludedWorkOrders
				&& this.appState.scanSettings.excludedWorkOrders.length > 0) {
					const found = this.appState.scanSettings.excludedWorkOrders.find(WO => WO === workOrderNum );
					if (found) {
						changeLogData.fixes.push('proofing');
						this.appState.changeLog.push(changeLogData);
						isSkip = true;
					}
				}

				const isMessageFlagged = !row.children[9].children[0].classList.contains("ng-hide");
				if (isMessageFlagged) changeLogData.fixes.push('red flag');

				const isNoMatOrFloat = !row.children[9].children[11].classList.contains("ng-hide");
				const matDimMismatch = !row.children[9].children[10].classList.contains("ng-hide");
				const isDimensionFlagged = isNoMatOrFloat || matDimMismatch

				const [artWidth, artHeight] = this.processArtDimensions(this.artDimensionsRef.innerText);

				const matOpeningWidth = parseFloat(this.widthInputRef.value);
				const matOpeningHeight = parseFloat(this.heightInputRef.value);


				const data = {
					workOrderNum,
					row,
					"measurements": {
						artWidth,
						artHeight,
						matOpeningWidth,
						matOpeningHeight
					},
					isNoMatOrFloat,
					isDimensionFlagged,
					isMessageFlagged
				}

				if (!isDimensionFlagged && !isMessageFlagged) {
					this.appState.toBeDARedLog.push(data);
					if (isSkip) return this.changeRowColor(row, 'skip');
					return this.changeRowColor(row, 'success');
				}

				if(this.mathChecksOut(data)) {
					if (isMessageFlagged) {
						this.appState.changeLog.push(changeLogData);
						if (isSkip) return this.changeRowColor(row, 'skip');
						return this.changeRowColor(row, 'flagged-no-change'); 					//light pink
					}
						this.appState.toBeDARedLog.push(data);
					if (isSkip) return this.changeRowColor(row, 'skip');
					return this.changeRowColor(row, 'no-change'); 								//green
				} else {

					changeLogData.fixes.push('sizing');
					this.appState.changeLog.push(changeLogData);

					this.appState.toBeFixedLog.push(data);
					if (isMessageFlagged) return this.changeRowColor(row, 'flagged-need-change'); //dark pink
					if (isSkip) return this.changeRowColor(row, 'skip');
					return this.changeRowColor(row, 'need-change');								// yellow
				}
			});

			rows[rows.length-1].click();
			this.sendDataToStorage().catch(e => {
				if (this.appState.debugMode) console.log(e);
					alert("unable to set data in local storage")
				}
			);
			this.toggleBlastShield();
		}, 500);
	}

	getPageRefs() {
		this.blastShieldRef = document.getElementById("jh-blast-shield");

		this.fieldsTab = document.querySelector('[aria-label="Work Order Fields"]');
		this.workflowTab = document.querySelector('[aria-label="Workflow"]');

		this.widthInputRef = document.getElementById('input_44');
		this.heightInputRef = document.getElementById('input_45');
		this.workOrderInstructionsRef = document.getElementById('input_39');
		this.saveButtonRef = document.querySelector('.work-order-form-save-popup > button');

		this.workOrderNumRef = document.querySelector("#tab-content-5 .production-info tr:nth-child(3) td:last-child");
		this.artDimensionsRef = document.querySelector(".artwork-info > div:last-of-type");


		this.workflowTab.click();
	}

	completeDigitalArtReview() {

		if(this.updateAppState) this.updateState();
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

	jobInterval(dataArr, func){
		let counter = 0;
		let setup = true;
		let time = 0;
		let data;
		const bufferTime = 3 ;
		let bufferCounter = 0;
		this.toggleBlastShield();
		this.intervalID = setInterval(()=>{

			let formReady = !this.saveButtonRef.hasAttribute('disabled');
			if (this.appState.debugMode) console.log('form ready: ', formReady);
			if(counter === dataArr.length){

				clearInterval(this.intervalID);
				this.toggleBlastShield();
				if (this.appState.debugMode) console.log('job done: interval cleared');

			} else {

				if(setup) {
					if (this.appState.debugMode) console.log('starting setup');

					data = dataArr[counter];
					data.row.click();
					setup = false;

					if (this.appState.debugMode) console.log('setup: ', data, setup);

				}
				if(!this.appState.waitingForJoinery){
					if (this.appState.debugMode) console.log('joinery Open!');
					func(data);
					if (this.appState.debugMode) console.log('provided function has run');
					this.appState.waitingForJoinery = true;

				}
				if(formReady) {

					if(bufferCounter < bufferTime) {

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
		},1000);
	}

	fixMeasurements() {
		this.fieldsTab.click();
		if(this.updateAppState) this.updateState();
		// const arr = this.appState.toBeFixedLog; //returns [ {data}, ... ]
		const arr = this.getRows(this.appState, "fix"); // returns [ rowElement, ...]
		if (arr.length === 0){
			if (this.appState.debugMode) console.log("no fixable items");
			return
		}

		//needs [{data}, ...], not [rowElement]

		this.jobInterval(arr, (data) => {

			let modifier = data.isNoMatOrFloat ? 0 : .25;
			this.changeOpeningValues(data.measurements.artWidth, data.measurements.artHeight, modifier);

		}, 3000);
	};

	appStateChanged () {
		if (this.appState.debugMode) console.log("state changed some more");
		if(!this.updateAppState) this.updateAppState = true;

	}

	updateState() {
		/* TODO:
		* 	 alter single settings on change to reduce queries
		*    excludedWorkOrders needs a more robust string manipulation to handle user errors
		* 	 work this in at start of each job perhaps by reworking jobInterval function
		* */
		if (this.appState.debugMode) console.log("updating state");
		this.appState = {
			...this.appState,
			"scanSettings": {
				"target": document.querySelector("input[name='radio-scan']:checked").value,
				"autoFix": document.getElementById("jh-auto-fix").checked,
				"autoDar": document.getElementById("jh-auto-dar").checked,
				"excludedWorkOrders": [...document.getElementById('jh-excluded').value.split(' ')],
			},
			"fixSettings": {
				"target": document.querySelector("input[name='radio-fix']:checked").value,
				"unsavedNewTab": document.getElementById("jh-auto-dar").checked,
			},
			"darSettings": {
				"target": document.querySelector("input[name='radio-fix']:checked").value
			},
			"debugMode": document.querySelector("input[name='jh-debug']").value
		}


		if (this.appState.debugMode) console.log("app state after update: ", this.appState);
	}

	getRows(state, tab) {
		//TODO rework to take target settings into account
		// tabs: scan, fix, flags, dar
		const allRows = Array.from(document.querySelectorAll(".data-grid-table-row"));
		const selectedRows = allRows.filter(row => row.querySelector('.md-checked'));
		const rowsEqual = allRows.length === selectedRows.length;
		const checkAll = document.querySelector('.data-grid-header md-checkbox');

		let rows
		switch(tab) {
			case "scan" :
				// sets rows to [rowElement, ...]
				if(state.scanSettings.target === 'all') {
					rows = allRows;
				} else {
					rows = selectedRows
				}
				break;

			case "fix" :
				// sets rows to [{data}, ...]
				if(state.fixSettings.target === 'yellows') {

					if (this.appState.debugMode) console.log("to be fixed log: ", state.toBeFixedLog);

					rows = [...state.toBeFixedLog].filter(data => !data.isMessageFlagged);

					if (this.appState.debugMode) console.log("sending these to the job Interval: ", rows);

				} else {
					if (this.appState.debugMode) console.log("fixing selected items");
					let arr = [];

					[...selectedRows].forEach(row =>
						arr.push(state.toBeFixedLog.find(data => data.workOrderNum === row.dataset.workorderNum))
					);
					rows = arr.filter(item => item !== undefined);
					if (this.appState.debugMode) console.log("selected items arr: ", rows);

				}
				break;

			case "flags" :
				rows = selectedRows.map(row => {
					return {row}
				});
				break;

			case "dar" :
				// sets rows to [{data}, ...] or [{row}, ...]
				if(state.darSettings.target === 'greens') {
					rows = [...state.toBeDARedLog]
					if (this.appState.debugMode) console.log("green items arr: ", rows);
				} else {
					rows = selectedRows.map(row => {
						return {row};
					});

				}
				break;

		}
		checkAll.click();
		if (!rowsEqual) checkAll.click();


		if (rows.length !== 0) return rows;
		return [];

	}

	cancel() {
		clearTimeout(this.intervalID);
		clearInterval(this.intervalID);
		this.toggleBlastShield();
	}

	async sendDataToStorage(){
		let data = {}
		let updatedData = {}
		this.appState.changeLog.forEach((item) => {
			data[item.workOrderNum] = item.fixes;
		});
		if (this.appState.debugMode) console.log("data arr: ", data);
		chrome.storage.local.get("joineryHelper")
			.then((res) => {

				if (this.appState.debugMode) console.log("response from local storage: ", res);

				if(Object.keys(data).length !== 0) Object.keys(data).forEach(key => {
					if(!Object.keys(res.joineryHelper).length > 0 // if storage is not empty
						&& res.joineryHelper.hasOwnProperty(key)) { // and if we have the key stored : merge the items
						if (this.appState.debugMode) console.log("merging data: ", key);
							updatedData[key] = [...new Set([...res.joineryHelper[key], ...data[key]])];

					} else {

						updatedData[key] = data[key];

					}
				});
				if (this.appState.debugMode) console.log("updated data: ", {...res.joineryHelper, ...updatedData});
				chrome.storage.local.set({"joineryHelper": {...res.joineryHelper, ...updatedData}})
					.catch(e => console.log("failed to set storage: ", e))
					.finally(() => this.appState.changeLog = []);
			})
			.catch(e => {
				if (this.appState.debugMode) console.log("failed to get storage: ", e)
			});
	}

	addStars() {
		let string = this.workOrderInstructionsRef.value
		if (this.appState.debugMode) console.log('WOI Value: ', string);
		if (string.slice(-3) === "***") return
		if (this.appState.debugMode) console.log("doesn't have stars already");
		this.workOrderInstructionsRef.dispatchEvent(new Event('focus'));
		this.workOrderInstructionsRef.value = string +'***';
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
		tableGridRows.forEach(row =>{
			row.style.removeProperty('background-color');
			row.style.removeProperty('color');
		});
		this.appState.toBeFixedLog = [];
		this.appState.toBeDARedLog = [];
		this.appState.changeLog = [];
		chrome.storage.local.set({"joineryHelper": {}}).then(e => {
			if (this.appState.debugMode) console.log("reset storage")
		});
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
		console.log('***** CHANGE LOG *****');
		chrome.storage.local.get("joineryHelper").then((res) => {
			let csvString = 'Workorder,Errors,User\n';
			Object.keys(res.joineryHelper).forEach(key => {

				csvString +=`${key},"${res.joineryHelper[key].join(', ')}",${name}\n`

			});
			console.log(csvString);
		}).catch(e => console.log("no changes to report"))
			.finally(()=> console.log('***** CHANGE LOG END *****'));

		/*
		const blob = new Blob([data], {type: "text/csv"});
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.setAttribute("href", url);
		a.setAttribute("download", "error-log.csv);
		a.click();
		a.remove();
		 */



	}

	toggleBlastShield() {
		if (this.appState.debugMode) console.log('blast shield toggled', this.blastShieldRef);
		this.appState.blastShield = !this.appState.blastShield
		this.blastShieldRef.classList.toggle("active");
		document.getElementById("jh-in-progress-content").classList.toggle("active")
		document.querySelector(".jh-content .selected").classList.toggle("loading");
	}
	 changeRowColor(rowEl, setting) {
		 switch(setting) {
			 case 'no-change':
			 case 'success':
				 rowEl.style.backgroundColor = 'lime';
				 break;
			 case 'need-change':
				 rowEl.style.backgroundColor = 'yellow';
				 break;
			 case 'flagged':
				 rowEl.style.backgroundColor = 'orange';
				 break;
			 case 'flagged-no-change':
				 rowEl.style.backgroundColor = 'lightpink';
				 break;
			 case 'flagged-need-change':
				 rowEl.style.backgroundColor = 'lightcoral';
				 break;
			 case 'skip':
			 case 'error':
			 default:
				 rowEl.style.backgroundColor = 'black';
				 rowEl.style.color = 'white';
		 }
	 }

	processArtDimensions(string) {
		string = string.replaceAll(/[wh'" ]/g, '')
		const dimensions = string.split('x');
		return [this.roundEighthFloor(parseFloat(dimensions[0])), this.roundEighthFloor(parseFloat(dimensions[1]))];
	}


	 mathChecksOut(data) {
		 if(!data.isDimensionFlagged) return true;

		 const {measurements} = data;

		 if(data.isNoMatOrFloat) {
			 return (measurements.artWidth === measurements.matOpeningWidth && measurements.artHeight === measurements.matOpeningHeight);
		 } else {
			 return (measurements.artWidth - .25) === measurements.matOpeningWidth && (measurements.artHeight - .25) === measurements.matOpeningHeight;
		 }
	 }

	roundEighthFloor (value) {
		if (value < 0) return 0
		let current = 0
		while (current <= value){
			current += .125
		}
		return current - .125;
	}

	makeUIDraggable() {
		// Make the DIV element draggable:
		dragElement(document.getElementById('JoineryHelper'));

		function dragElement(elmnt) {
			let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
			elmnt.onmousedown = dragMouseDown;

			function dragMouseDown(e) {
				e = e || window.event;
				e.preventDefault();
				// get the mouse cursor position at startup:
				pos3 = e.clientX;
				pos4 = e.clientY;
				document.onmouseup = closeDragElement;
				// call a function whenever the cursor moves:
				document.onmousemove = elementDrag;
			}

			function elementDrag(e) {
				e = e || window.event;
				e.preventDefault();
				// calculate the new cursor position:
				pos1 = pos3 - e.clientX;
				pos2 = pos4 - e.clientY;
				pos3 = e.clientX;
				pos4 = e.clientY;
				// set the element's new position:
				elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
				elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
			}

			function closeDragElement() {
				// stop moving when mouse button is released:
				document.onmouseup = null;
				document.onmousemove = null;
			}
		}
	}
}


