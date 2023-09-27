import Util from "./Utilities";

export default class Scan {
    constructor() {

    }

    start(rows, refs, state, callbacks = []){
        // done as an interval to ensure blast shield and state changes are handled first
        const nextState = {
            ...state,
            changeLog: [],
            toBeDARedLog: [],
            toBeFixedLog: []
        }
        return setTimeout(() => {
            // const rows = this.getRows(this.appState, 'scan');
            const max = rows.length;

            rows.forEach( (row, index, array) => {
                if (state.debugMode) console.log(`item ${index+1}/${max}`);

                row.click();

                let data = {
                    workOrderNum: refs.workOrderNumRef.innerHTML,
                    isSkip: false,
                    changeLogData: [],
                    row
                }

                // changeLogData = {workOrderNum, fixes:[]}
                row.dataset.workorderNum = data.workOrderNum;

                data = this.checkIsExcluded(data,nextState)
                data = this.attachFlags(data, refs)
                this.sortIntoColors(data, nextState)



            })

            rows[rows.length-1].click();
            if(callbacks.length)callbacks.forEach(cb => cb(nextState))
        }, 500);
    }

    checkIsExcluded(data, state){
        const obj = data
        obj.isSkip = false
        if(state.scanSettings.excludedWorkOrders
            && state.scanSettings.excludedWorkOrders.length > 0) {
            const found = state.scanSettings.excludedWorkOrders.find(WO => WO === obj.workOrderNum );
            if (found) {
                obj.changeLogData.push('proofing');
                obj.isSkip = true;
                state.changeLog.push(obj);
            }
        }
        return obj
    }
    attachFlags(data, refs){
        //updated query based on row   structure:  row.children[9].children[0].classList.includes("ng-hide")
        // .children[9] is the flags column on joinery
        // 0: message   Chat message
        // ...
        // 10: mat dim mismatch   Triangle
        // 11: no mat size mismatch  Square with inside lines
        const obj = data
        const isMessageFlagged = !obj.row.children[9].children[0].classList.contains("ng-hide");
        if (isMessageFlagged) obj.changeLogData.push('red flag');

        const isNoMatOrFloat = !obj.row.children[9].children[10].classList.contains("ng-hide");
        const matDimMismatch = !obj.row.children[9].children[9].classList.contains("ng-hide");
        const isDimensionFlagged = isNoMatOrFloat || matDimMismatch

        const [artWidth, artHeight] = Util.processArtDimensions(refs.artDimensionsRef.innerText);

        const matOpeningWidth = parseFloat(refs.widthInputRef.value);
        const matOpeningHeight = parseFloat(refs.heightInputRef.value);

        return {
            ...obj,
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



    }
    sortIntoColors(dataObj, state){
        const data = dataObj

        if (!data.isDimensionFlagged && !data.isMessageFlagged) {
            if (data.isSkip) return this.changeRowColor(data, 'skip');
            state.toBeDARedLog.push(data);
            return this.changeRowColor(data, 'success');
        }

        if(Util.mathChecksOut(data)) {
            if (data.isMessageFlagged) {
                state.changeLog.push(data);
                if (data.isSkip) return this.changeRowColor(data, 'skip');   //black path
                return this.changeRowColor(data, 'flagged-no-change'); 		//light pink
            }
            if (data.isSkip) return this.changeRowColor(data, 'skip');       //black path
            state.toBeDARedLog.push(data);
            return this.changeRowColor(data, 'no-change'); 					//green path
        } else {
            if (data.isSkip) return this.changeRowColor(data, 'skip');
            data.changeLogData.push('sizing');
            state.changeLog.push(data);
            state.toBeFixedLog.push(data);

                   //black path
            if (data.isMessageFlagged) return this.changeRowColor(                      //dark pink
                data, 'flagged-need-change'
            );

            return this.changeRowColor(data, 'need-change');					// yellow
        }
    }

    changeRowColor(data, setting) {
        const {row} = data
        switch(setting) {
            case 'no-change':
            case 'success':
                row.style.backgroundColor = 'lime';
                // return data
                break;
            case 'need-change':
                row.style.backgroundColor = 'yellow';
                // return data
                break;
            case 'flagged':
                row.style.backgroundColor = 'orange';
                // return data
                break;
            case 'flagged-no-change':
                row.style.backgroundColor = 'lightpink';
                // return data
                break;
            case 'flagged-need-change':
                row.style.backgroundColor = 'lightcoral';
                // return data
                break;
            case 'skip':
            case 'error':
            default:
                row.style.backgroundColor = 'black';
                row.style.color = 'white';
                // return data

        }
    }


}