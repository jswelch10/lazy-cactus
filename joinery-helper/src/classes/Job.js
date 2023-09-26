export default class Job {
    constructor(jh) {
        this.jh = jh;
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
    jobInterval(dataArr, func, isDAR = false){
        let isDar = isDar;
        let counter = 0;
        let setup = true;
        let time = 0;
        let data;
        const bufferTime = 3 ;
        let bufferCounter = 0;
        this.toggleBlastShield();
        this.intervalID = setInterval(()=>{

            let formReady = isDar ?
                !this.saveButtonRef.hasAttribute('disabled'): //THIS LINE HERE, OFFICER
                !this.saveButtonRef.hasAttribute('disabled');
            if (this.appState.debugMode) console.log('form ready: ', formReady);
            if(counter === dataArr.length){

                clearInterval(this.intervalID);
                this.toggleBlastShield();
                if (this.appState.debugMode) console.log('job done: interval cleared');

            } else {

                if(setup) {
                    if (this.appState.debugMode) console.log('starting setup');

                    data = dataArr[counter];
                    data.row.scrollIntoView({block:"center",behavior:"smooth"});
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

    flagHandler() {
        const arr = this.getRows(this.appState, "flags");

        this.jobInterval(arr, () => {

            this.addStars();

        });
    }

    completeDigitalArtReview() {

        if(this.updateAppState) this.updateState();
        const arr = this.getRows(this.appState, 'dar');


        this.workflowTab.click();

        this.jobInterval(arr, () => {
            document.querySelector('md-checkbox[aria-label="Digital Art Review"]').click();
        }, true);
    };
}