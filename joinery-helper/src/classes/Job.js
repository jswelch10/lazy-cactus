export default class Job {
    constructor(state, dataArr, refs) {
        this.appState = state
        this.dataArr = dataArr
        this.refs = refs
        this.intervalID = undefined
    }
    get id() {
        if(!this.intervalID) console.error('interval has not be set, start a job before getting id')
        return this.intervalID
    }
    fix(intervalEndCallback){
        this.refs.fieldsTab.click()
        const job = data => {
            let modifier = data.isNoMatOrFloat ? 0 : .25;
            this.changeOpeningValues(data.measurements.artWidth, data.measurements.artHeight, modifier);
        }
        this.createInterval(job, intervalEndCallback)
    }
    addStars(intervalEndCallback) {
        const job = () => {
            let string = this.refs.workOrderInstructionsRef.value
            if (this.appState.debugMode) console.log('WOI Value: ', string);
            if (string.slice(-3) === "***") return
            if (this.appState.debugMode) console.log("doesn't have stars already");
            this.refs.workOrderInstructionsRef.dispatchEvent(new Event('focus'));
            this.refs.workOrderInstructionsRef.value = string + '***';
            this.refs.workOrderInstructionsRef.dispatchEvent(new Event('change'));
            this.refs.workOrderInstructionsRef.dispatchEvent(new Event('blur'));

            this.refs.saveButtonRef.click();
        }
        this.createInterval(job, intervalEndCallback)
    }

    dar(intervalEndCallback) {
        this.refs.workflowTab.click();
        const job = () => {
            //TODO add more checking in here, if its already clicked
            document.querySelector('md-checkbox[aria-label="Digital Art Review"]').click();
        }
        this.createInterval(job, intervalEndCallback)
    }

    createInterval(func, cb) {
        let counter = 0;
        let setup = true;
        let time = 0;
        let data;
        const bufferTime = 3;
        let bufferCounter = 0;
        // this.toggleBlastShield();
        this.intervalID = setInterval(() => {

            let formReady = !this.refs.saveButtonRef.hasAttribute('disabled');
            if (this.appState.debugMode) console.log('form ready: ', formReady);
            if (counter === this.dataArr.length) {// check if job is at the end

                clearInterval(this.intervalID);
                cb()
                if (this.appState.debugMode) console.log('job done: interval cleared');

            } else {

                if (setup) {
                    if (this.appState.debugMode) console.log('starting setup');

                    data = this.dataArr[counter];
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
        console.log(this.intervalID)
    }

    changeOpeningValues(width, height, modifier) {
        width -= modifier;
        height -= modifier;
        if (this.appState.debugMode) console.log('change values to: ', width, height);
        this.refs.widthInputRef.dispatchEvent(new Event('focus'));
        this.refs.widthInputRef.value = width;
        this.refs.widthInputRef.dispatchEvent(new Event('change'));
        this.refs.widthInputRef.dispatchEvent(new Event('blur'));
        this.refs.heightInputRef.dispatchEvent(new Event('focus'));
        this.refs.heightInputRef.value = height;
        this.refs.heightInputRef.dispatchEvent(new Event('change'));
        this.refs.heightInputRef.dispatchEvent(new Event('blur'));

        this.refs.saveButtonRef.click();
    }

}