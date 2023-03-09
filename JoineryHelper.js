class JoineryHelper {
	constructor(workorders) {
		//test WO 'W421659951270483'
		this.skipLog = [];
		this.changeLog = [];
		this.workorders = workorders;
		this.loadTimeInMS = 1000;
		this.mainElement = document.createElement("div");

		// this.init(workorders);

		//perhaps an iterator function that progresses based on promises, and a loop that continuously runs?


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
			'background-color:DarkOliveGreen;' +
			'color:white;' +
			'border-radius:5px' +
			'padding:3px;';
		const mainCSS =
			'background-color:DarkGreen;' +
			'width:200px;' +
			'height:100px;' +
			'display:flex;' +
			'align-content:center;' +
			'justify-content:center;' +
			'position:absolute;' +
			'z-index:10;'
		const joinery = document.getElementById("joinery");

		this.mainElement.setAttribute("id", UserInterfaceID);
		this.mainElement.setAttribute("style", mainCSS);

		const scanButton = document.createElement("button");
		scanButton.setAttribute("id", "scanBtn");
		scanButton.setAttribute("type", "button");
		scanButton.setAttribute("style", buttonCSS);
		// scanButton.setAttribute("onclick", this.scan.);
		scanButton.onclick = this.scan.bind(this);

		const scanBtnContent = document.createTextNode("Scan");
		scanButton.appendChild(scanBtnContent);
		this.mainElement.appendChild(scanButton);

		const resetButton = document.createElement("button");
		resetButton.setAttribute("id", "resetBtn");
		resetButton.setAttribute("type", "button");
		resetButton.setAttribute("style", buttonCSS);
		// scanButton.setAttribute("onclick", this.scan.);
		resetButton.onclick = this.reset.bind(this);

		const resetBtnContent = document.createTextNode("Reset");
		resetButton.appendChild(resetBtnContent);
		this.mainElement.appendChild(resetButton);


		joinery.appendChild(this.mainElement);

		this.makeUIDraggable(UserInterfaceID);
		const setupRow = document.querySelector(".data-grid-table-row");
		setupRow.click();
		document.querySelector('[aria-label="Measurements"]').click();
		setupRow.click();

	}

	scan() {

		//conform workorders to an array data structure from a csv string or otherwise

		//loop through data grid table rows
		const tableGridRows = document.querySelectorAll(".data-grid-table-row");
		if(tableGridRows.length === 0) return;

		// not sure why, but this code is needed to make sure the data is loaded into the joinery sidebar correctly
		// tableGridRows[0].click();
		// document.querySelector('[aria-label="Measurements"]').click();
		// tableGridRows[0].click();

		tableGridRows.forEach( (row, index, array) => {
			row.click();

			// const rowQuery = `.data-grid-table-row:nth-child(${index + 1})`
			// this.changeRowColor(row, 'current');
			const currWorkOrderNum = document.querySelector("#tab-content-5 .production-info tr:nth-child(3) td:last-child").innerHTML;
			console.log(currWorkOrderNum);
			//skip workorders(WO's) that match constructor parameter
			if(this.workorders && this.workorders.length > 0) {
				const found = this.workorders.find(WO => WO === currWorkOrderNum );
				//turn them red
				if (found) return this.changeRowColor(row, 'skip');
			}

			//skip WO's with a red flag
			const isMessageFlagged = ![...row.children[9].children[0].classList].includes("ng-hide");
			if (isMessageFlagged) return this.changeRowColor(row, 'skip');

			const hasAccentMat = document.querySelectorAll('.production-info')[2].children[0].children[6] === undefined ? 2 : 6;

			const [artWidth, artHeight] = this.processArtDimensions(document.querySelector(".artwork-info > div:last-of-type").innerText);
			const [matOpeningWidth, matOpeningHeight] = this.processArtDimensions(document.querySelectorAll('.production-info')[2].children[0].children[hasAccentMat].children[1].innerText);

			let needsChange = false;

			const isNoMatOrFloat = ![...row.children[9].children[11].classList].includes("ng-hide");
			console.log('is no mat or float', isNoMatOrFloat);
			// document.querySelectorAll('.production-info')[2].children[0].children[6]
			// document.querySelectorAll('.production-info')[2].children[0].children[hasAccentMat].children[1].innerText
			if(isNoMatOrFloat && artWidth === matOpeningWidth && artHeight === matOpeningHeight) {
				return this.changeRowColor(row, 'no-change');
			} else if(isNoMatOrFloat){
				//do changing/saving stuff
				this.changeLog.push([currWorkOrderNum, 'Float/Mat']);
				needsChange = true;
			}

			const matDimMismatch = ![...row.children[9].children[10].classList].includes("ng-hide");
			console.log('mat dim mismatch', matDimMismatch);
			if(matDimMismatch && (artWidth - .25) === matOpeningWidth && (artHeight - .25) === matOpeningHeight) {
				return this.changeRowColor(row, 'no-change');
			} else if(matDimMismatch){
				//do changing/saving stuff


				this.changeLog.push([currWorkOrderNum, 'mismatch']);
				needsChange = true;
			}
			const data = {
				hasAccentMat,
				artWidth,
				artHeight,
				matOpeningWidth,
				matOpeningHeight
			}
			console.log(data);

			//the workorder must be logged for future use alongside denotation that it is a sizing/gray box error

			//if the sizing is off then it must be corrected and saved

			//for testing we use color yellow instead of saving
			needsChange ? this.changeRowColor(row,'need-change') : this.changeRowColor(row, 'success');
		});
		// console.log(this.changeLog);

	}

	fix() {};

	reset() {
		const tableGridRows = document.querySelectorAll(".data-grid-table-row");
		tableGridRows.forEach(row =>{
			row.style.removeProperty('background-color');
		});
	}

	processArtDimensions(string) {
		// string = string.replaceAll('"', '').replaceAll('&nbsp;x&nbsp;', ',').replaceAll('','');
		console.log('before replaceAll:', string);
		string = string.replaceAll(/[wh'" ]/g, '')
		const dimensions = string.split('x');
		console.log('dimensions:', dimensions);
		return [this.roundEighthFloor(parseFloat(dimensions[0])), this.roundEighthFloor(parseFloat(dimensions[1]))];
	}

	changeRowColor(rowEl, data) {
		switch(data) {
			case 'current':
				rowEl.style.backgroundColor = 'fuchsia';
				break;
			case 'no-change':  //TODO: add distinction when app is capable of saving on its own
			case 'success':
				rowEl.style.backgroundColor = 'lime';
				break;
			case 'need-change':
				rowEl.style.backgroundColor = 'orange';
				break;
			case 'skip':
			case 'error':
			default:
				rowEl.style.backgroundColor = 'firebrick';
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
		console.log(elementId);
		console.log(document.getElementById(elementId));
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


//needed variables and their css selectors
	//data grid table rows			document.getElementsByClassName("data-grid-table-row");

	// artwork info					document.querySelector(".artwork-info > div:last-of-type").innerHTML;
									// function decodeHtml(html) {       potentially use this to dolve for HTML entities
									// 	var txt = document.createElement("textarea");
									// 	txt.innerHTML = html;
									// 	return txt.value;
									// }
	//md tab content
	//order info tab				document.querySelector("#tab-content-5")
		//work order number				.production-info tr:nth-child(3) td:last-child").innerHTML
	//work order fields tab			document.querySelector("#tab-content-6") XXXXXXXXXX come back later
		//opening width					XXX
		//opening height				XXX
		//WO Instructions				XXX
	//measurements tab				document.querySelector("#tab-content-8")
		//Mat style						.production-info table:nth-child(1) tr:first-child td:last-child
		// opening dimensions     		.production-info table:nth-child(1) tr:first-child td:last-child
		//mounting Type					.production-info table:nth-child(3) tr:nth-child(2) td:last-child
	//workflow tab					document.querySelector("#tab-content-11")
		//digital art review check		document.querySelector("[aria-label='Digital Art Review']")

	//eventually code for inputting internal logged WO's into the external WO logging process


