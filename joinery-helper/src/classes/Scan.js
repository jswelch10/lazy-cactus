// noinspection DuplicatedCode

export default class Scan {
    constructor(JoineryHelper) {
        this.jh = JoineryHelper
    }
    scan() {

        document.getElementById('jh-excluded').blur();
        //this.toggleBlastShield();
        this.jh.sendFor('userInterface', 'toggleBlastShield')()

        //if(this.updateAppState) this.updateState();
        this.jh.updateState()

        // done as an interval to ensure blast shield and state changes are handled first

        this.jh.intervalID = setTimeout(() => {
            //const rows = this.getRows(this.appState, 'scan');
            const rows = this.jh.sendFor('userInterface','getRows')(this.jh.state, 'scan');
            const max = rows.length;
            rows.forEach( (row, index) => {
                if (this.jh.appState.debugMode) console.log(`item ${index+1}/${max}`);

                row.click();

                const workOrderNum = this.jh.sendFor('userInterface','workOrderNumRef').innerHTML;
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

                const isNoMatOrFloat = !row.children[9].children[10].classList.contains("ng-hide");
                const matDimMismatch = !row.children[9].children[9].classList.contains("ng-hide");
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
}