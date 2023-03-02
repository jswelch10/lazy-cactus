class JoineryHelper {
	constructor(debug) {
		this.skipLog = [];
		this.toBeFixedLog = [];
		this.toBeReviewedLog = [];
		this.changeLog = [];
		this.waitingForJoinery = false;
		this.excludedWorkorders = [];
		this.mainElement = document.createElement("div");
		this.jobDebug = debug && true;



		//updated query based on row   structure:  row.children[9].children[0].classList.includes("ng-hide")
		// .children[9] is the flags column on joinery
		// 0: message   Chat message
		// ...
		// 10: mat dim mismatch   Triangle
		// 11: no mat size mismatch  Square with inside lines

		this.init();
	}
	init() {
		const UserInterfaceID = "joineryHelper";
		const buttonCSS =
			'background-color:purple;' +
			'color:white;' +
			'border-radius:5px;' +
			'padding:10px;';
		const mainCSS =
			'background-color:white;' +
			'width:220px;' +
			'height:150px;' +
			'display:grid;' +
			'grid-template-columns: 1fr 1fr;' +
			'grid-template-rows: repeat(3, 1fr);' +
			'position:absolute;' +
			'z-index:10;' +
			'border:solid gray;' +
			'padding: 5px;'
		const joinery = document.getElementById("joinery");

		this.mainElement.setAttribute("id", UserInterfaceID);
		this.mainElement.setAttribute("style", mainCSS);

		const scanButton = document.createElement("button");
		scanButton.setAttribute("id", "scanBtn");
		scanButton.setAttribute("type", "button");
		scanButton.setAttribute("style", buttonCSS);
		scanButton.onclick = this.scan.bind(this);

		const scanBtnContent = document.createTextNode("Scan");
		scanButton.appendChild(scanBtnContent);
		this.mainElement.appendChild(scanButton);

		const fixButton = document.createElement("button");
		fixButton.setAttribute("id", "fixBtn");
		fixButton.setAttribute("type", "button");
		fixButton.setAttribute("style", buttonCSS);
		fixButton.onclick = this.fixMeasurements.bind(this);

		const fixBtnContent = document.createTextNode("Fix Selected");
		fixButton.appendChild(fixBtnContent);
		this.mainElement.appendChild(fixButton);

		////////////////////////////////////////////////////////////

		const starButton = document.createElement("button");
		starButton.setAttribute("id", "starBtn");
		starButton.setAttribute("type", "button");
		starButton.setAttribute("style", buttonCSS);
		starButton.onclick = this.addWorkOrderInstructionStars.bind(this);

		const starBtnContent = document.createTextNode("*** Selected");
		starButton.appendChild(starBtnContent);
		this.mainElement.appendChild(starButton);

		const darButton = document.createElement("button");
		darButton.setAttribute("id", "darBtn");
		darButton.setAttribute("type", "button");
		darButton.setAttribute("style", buttonCSS);
		darButton.onclick = this.completeDigitalArtReview.bind(this);

		const darBtnContent = document.createTextNode("DAR Selected");
		darButton.appendChild(darBtnContent);
		this.mainElement.appendChild(darButton);

		const cancelButton = document.createElement("button");
		cancelButton.setAttribute("id", "cancelBtn");
		cancelButton.setAttribute("type", "button");
		cancelButton.setAttribute("style", buttonCSS);
		cancelButton.onclick = this.cancel.bind(this);

		const cancelBtnContent = document.createTextNode("Cancel Job");
		cancelButton.appendChild(cancelBtnContent);
		this.mainElement.appendChild(cancelButton);

		////////////////////////////////////////////////////////////

		const resetButton = document.createElement("button");
		resetButton.setAttribute("id", "resetBtn");
		resetButton.setAttribute("type", "button");
		resetButton.setAttribute("style", buttonCSS);
		resetButton.onclick = this.reset.bind(this);

		const resetBtnContent = document.createTextNode("Reset");
		resetButton.appendChild(resetBtnContent);
		this.mainElement.appendChild(resetButton);


		joinery.appendChild(this.mainElement);

		this.makeUIDraggable(UserInterfaceID);


		this.measurementsTab = document.querySelector('[aria-label="Measurements"]');
		this.fieldsTab = document.querySelector('[aria-label="Work Order Fields"]');

		this.widthInputRef = document.getElementById('input_44');
		this.heightInputRef = document.getElementById('input_45');
		this.workOrderInstructionsRef = document.getElementById('input_39');
		this.saveButtonRef = document.querySelector('.work-order-form-save-popup > button');

		this.mountingTypeRef = document.getElementById('select_42');
		// this.matStyleRef = document.querySelectorAll(".production-info")[2].children[0].children[0].children[1].children[0];
		this.matStyleRef = document.getElementById('select_6649');


		this.workOrderNumRef = document.querySelector("#tab-content-5 .production-info tr:nth-child(3) td:last-child");
		this.artDimensionsRef = document.querySelector(".artwork-info > div:last-of-type");
		this.digitalArtReviewRef = document.querySelector('md-checkbox[aria-label="Digital Art Review"]');



		// const setupRow = document.querySelector(".data-grid-table-row");
		//
		// // this code is needed to initialize the sidebar for a proper scan
		// setupRow.click();
		// this.measurementsTab.click();
		// setupRow.click();
	}

	scan() {
		// setup rows based on selectedItems || allItems;
		const rows = this.getRows('', true);

		rows.forEach( (row, index, array) => {
			row.click();
			this.measurementsTab.click();

			const currWorkOrderNum = this.workOrderNumRef.innerHTML;
			console.log(currWorkOrderNum);
			// skip workorders(WO's) that match constructor parameter
			if(this.excludedWorkorders && this.excludedWorkorders.length > 0) {
				const found = this.excludedWorkorders.find(WO => WO === currWorkOrderNum );
				if (found) return this.changeRowColor(row, 'skip');
			}
			const isMessageFlagged = !row.children[9].children[0].classList.contains("ng-hide");

			const [artWidth, artHeight] = this.processArtDimensions(this.artDimensionsRef.innerText);
			const matOpeningWidth = parseFloat(this.widthInputRef.value);
			const matOpeningHeight = parseFloat(this.heightInputRef.value);
			console.log('openings: ', matOpeningWidth, matOpeningHeight);

			let needsChange = false;
			let changes = [currWorkOrderNum];
			// after the first float, noMat are incorrectly looking in the wrong place?
			// conditionally check if a float exists and if not, only then check if a


			this.fieldsTab.click();
			//document.querySelector('[aria-label="Mat: No Mat - NM00"]'); this returns an item if it exists
			//const isNoMatOrFloat = this.mountingTypeRef.innerText === 'Float #1' || this.matStyleRef.innerText === 'Float Mounting (+$25) - Float' || this.matStyleRef.innerText === 'No Mat - NM00';
			const isNoMatOrFloat = this.mountingTypeRef.innerText === 'Float #1'
				|| !!document.querySelector('[aria-label="Mat: Float Mounting (+$25) - Float"]')
				|| !!document.querySelector('[aria-label="Mat: No Mat - NM00"]')
			// console.log('mat style: ',  this.matStyleRef, this.matStyleRef.innerText);
			// console.log('mounting type: ', this.mountingTypeRef, this.mountingTypeRef.innerText);

			const data = {
				"workOrderNum": currWorkOrderNum,
				row,
				"measurements": {
					artWidth,
					artHeight,
					matOpeningWidth,
					matOpeningHeight
				},
				isNoMatOrFloat
			}

			if(data.isNoMatOrFloat) {
				if(this.mathChecksOut(data)) {
					console.log('good noMat/Float', data);
					if (isMessageFlagged) return this.changeRowColor(row, 'flagged-no-change');
					return this.changeRowColor(row, 'no-change');
				} else {
					console.log('bad noMat/Float', data);
					changes.push('gray fix')
					needsChange = true;
				}
			} else {
				if(this.mathChecksOut(data)) {
					console.log('good dimensions', data);
					if (isMessageFlagged) return this.changeRowColor(row, 'flagged-no-change');
					return this.changeRowColor(row, 'no-change');
				} else {
					console.log('bad dimensions', data);
					changes.push('wrong size');
					needsChange = true;
				}
			}


			if(needsChange){
				console.log('needsChange triggered');
				this.changeLog.push(changes)
				this.toBeFixedLog.push(data);
				if (isMessageFlagged) return this.changeRowColor(row, 'flagged-need-change');
				return this.changeRowColor(row, 'need-change');
			} else {
				if (isMessageFlagged) return this.changeRowColor(row, 'flagged-no-change');
				this.toBeReviewedLog.push(data);
				console.log('success');
				return this.changeRowColor(row, 'success');
			}
		});
	
	}
	//TODO turn this.waitingForJoinery or another setting into a setter function so it can trigger html blast screen;

	completeDigitalArtReview() {
		//jobInterval functon needs an array of objects that posses a property "row" pointing to an html element
		const arr = this.getRows('', false).map(row => {
			return {row}
		});

		this.jobInterval(arr, (data) => {

			this.digitalArtReviewRef.click();

		});
	};

	addWorkOrderInstructionStars() {
		const arr = this.getRows('', false).map(row => {
			return {row}
		});

		this.jobInterval(arr, (data) => {

			this.addStars();

		});
	}


	jobInterval(dataArr, func){
		const debugMode =  this.jobDebug;
		let counter = 0;
		let setup = true;
		let time = 0;
		let data;
		const bufferTime = 3 ;
		let bufferCounter = 0;
		this.intervalID = setInterval(()=>{

			let formReady = !this.saveButtonRef.hasAttribute('disabled');
			if (debugMode) console.log('form ready: ', formReady);
			if(counter === dataArr.length){

				clearInterval(this.intervalID);
				console.log('job done: interval cleared');

			} else {

				if(setup) {
					if (debugMode) console.log('starting setup');
					data = dataArr[counter];
					if (debugMode) console.log(data);
					data.row.click();
					setup = false;
					if (debugMode) console.log('setup: ', data, setup);

				}
				if(!this.waitingForJoinery){
					if (debugMode) console.log('joinery Open!');
					func(data);
					if (debugMode) console.log('provided function has run');
					this.waitingForJoinery = true;
					if (debugMode) console.log('joinery closed? ', this.waitingForJoinery);

				}
				if(formReady) {

					if(bufferCounter < bufferTime) {

						bufferCounter++;

					} else {
						if (debugMode) console.log('done saving');
						setup = true;
						if (debugMode) console.log('setup reset');
						bufferCounter = 0;
						counter++;
						if (debugMode) console.log('new counter: ', counter);
						this.waitingForJoinery = false;

					}
				}
				console.log(`${time} seconds have passed...`);
				time++;
			}
		},1000);
	}

	fixMeasurements() {
		// this.fieldsTab.click();

		const arr = this.toBeFixedLog; //returns [ {data}, ... ]
		// const arr = this.getRows(this.toBeFixedLog, false); // returns [ rowElement, ...]

		this.jobInterval(arr, (data) => {

			let modifier = data.isNoMatOrFloat ? 0 : .25;
			this.changeOpeningValues(data.measurements.artWidth, data.measurements.artHeight, modifier);

		});

			//modifier = current.isNoMatOrFloat ? 0 : .25;
			// this.changeOpeningValues(current.measurements.artWidth, current.measurements.artHeight, modifier);

	};

	// fixMeasurements() {
	// 	const arr = this.toBeFixedLog;
	// 	let counter = 0;
	// 	let setup = true;
	// 	let time = 0;
	// 	let current;
	// 	const bufferTime = 3 ;
	// 	let bufferCounter = 0;
	// 	let modifier = 0;
	// 	// e.g. data = {}
	// 	// const form = document.querySelector('#tab-content-6 form');
	// 	this.intervalID = setInterval(()=>{
	// 		let formReady = !this.saveButtonRef.hasAttribute('disabled');
	// 		console.log('form ready: ', formReady);
	// 		if(counter === arr.length){
	// 			clearInterval(this.intervalID);
	// 			console.log('interval cleared');
	// 		} else {
	// 			if(setup) {
	// 				console.log('starting setup');
	// 				current = arr[counter];
	// 				console.log(current);
	// 				current.row.click();
	// 				modifier = current.isNoMatOrFloat ? 0 : .25;
	// 				setup = false;
	// 				console.log('setup: ',current, modifier, setup);
	// 			}
	// 			if(!this.waitingForJoinery){
	// 				console.log('joinery Open!')
	// 				this.changeValues(current.measurements.artWidth, current.measurements.artHeight, modifier); // set current item to given parameters
	// 				console.log('new values changed: ', current.measurements.artWidth - modifier, current.measurements.artHeight - modifier);
	// 				this.waitingForJoinery = true;
	// 				console.log('joinery closed? ', this.waitingForJoinery);
	// 			}
	// 			if(formReady) { //maybe not related to formReady, but func is skipping every other row, myabe too fast?
	// 				if(bufferCounter < bufferTime) {
	// 					bufferCounter++;
	// 				} else {
	// 					console.log('done saving');
	// 					this.waitingForJoinery = false;
	// 					counter++;
	// 					console.log('new counter: ', counter);
	// 					setup = true;
	// 					bufferCounter = 0;
	// 					console.log('setup reset');
	// 				}
	// 			}
	//
	// 			console.log(`${time} seconds have passed...`);
	// 			time++;
	// 		}
	// 	},1000);


	//setInterval with a function with a nested if statement checking classList on the sidebar to determine if it is active
		// if it is able to be manipulated then click and change the data and increment the current counter to an array index i.e. array[i];
	getRows(rowsFromLogArr, isScan) {
		if(rowsFromLogArr.length > 0) return rowsFromLogArr.reduce(data => data.row);
		const allRows = Array.from(document.querySelectorAll(".data-grid-table-row"));
		const selectedRows = allRows.filter(row => row.querySelector('.md-checked'));
		const rows = selectedRows.length === 0 && isScan ? allRows : selectedRows;
		const rowsEqual = allRows.length === selectedRows.length;
		if(rows.length === 0) return;

		//deselect multiple rows
		const checkAll = document.querySelector('.data-grid-header md-checkbox');
		checkAll.click();
		if (!rowsEqual) checkAll.click();

		return rows;
	}

	cancel() {
		clearInterval(this.intervalID);
	}

	mathChecksOut(data) {
		const {measurements} = data;
		if(data.isNoMatOrFloat) {
			return (measurements.artWidth === measurements.matOpeningWidth && measurements.artHeight === measurements.matOpeningHeight);
		} else {
			return (measurements.artWidth - .25) === measurements.matOpeningWidth && (measurements.artHeight - .25) === measurements.matOpeningHeight;
		}
	}

	addStars() {// should return true if no changes are made
		let string = this.workOrderInstructionsRef.value
		console.log('WOI Value: ', string);
		if (string.slice(-3) === "***") return
		console.log("doesn't have stars already");
		//check if stars are last 3 char in input
			//if not add them
		this.workOrderInstructionsRef.dispatchEvent(new Event('focus'));
		this.workOrderInstructionsRef.value = string +'***';
		console.log('WOI New Value: ', string);
		this.workOrderInstructionsRef.dispatchEvent(new Event('change'));
		this.workOrderInstructionsRef.dispatchEvent(new Event('blur'));

		this.saveButtonRef.click();
	}

	changeOpeningValues(width, height, modifier) {
		width -= modifier;
		height -= modifier;
		console.log('change values to: ', width, height);
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

	reset() {
		const tableGridRows = document.querySelectorAll(".data-grid-table-row");
		tableGridRows.forEach(row =>{
			row.style.removeProperty('background-color');
			row.style.removeProperty('color');
		});
		this.toBeFixedLog = [];
		this.toBeReviewedLog = [];
		this.changeLog = [];
		this.cancel();
		// this.mainElement.remove();
	}

	processArtDimensions(string) {
		// string = string.replaceAll('"', '').replaceAll('&nbsp;x&nbsp;', ',').replaceAll('','');
		string = string.replaceAll(/[wh'" ]/g, '')
		const dimensions = string.split('x');
		return [this.roundEighthFloor(parseFloat(dimensions[0])), this.roundEighthFloor(parseFloat(dimensions[1]))];
	}

	changeRowColor(rowEl, setting) {
		switch(setting) {
			case 'no-change':
			case 'success':
				rowEl.style.backgroundColor = 'lime';
				break;
			// case 'current':
			// 	rowEl.style.backgroundColor = 'fuchsia';
			// 	break;
			case 'need-change':
				rowEl.style.backgroundColor = 'yellow';
				break;

			case 'flagged-no-change':
				rowEl.style.backgroundColor = 'tomato';
				break;
			case 'flagged-need-change':
				rowEl.style.backgroundColor = 'firebrick';
				break;
			case 'skip':
			case 'error':
			default:
				rowEl.style.backgroundColor = 'black';
				rowEl.style.color = 'white';
		}
	}

	roundEighthFloor (value) {
		let current = 0
		while (current <= value){
			current += .125
		}
		return current === 0 ? 0: (current - .125);
	}

	makeUIDraggable(elementId) {
		// Make the DIV element draggable:
		dragElement(document.getElementById(elementId));

		function dragElement(elmnt) {
			let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
			// if (document.getElementById(elmnt.id + "header")) {
				// if present, the header is where you move the DIV from:
				// document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
			// } else {
				// otherwise, move the DIV from anywhere inside the DIV:
				elmnt.onmousedown = dragMouseDown;
			// }

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


	//order info tab				document.querySelector("#tab-content-5")
	//work order fields tab			document.querySelector("#tab-content-6")


	//workflow tab					document.querySelector("#tab-content-11")
		//digital art review check		document.querySelector("[aria-label='Digital Art Review']")
