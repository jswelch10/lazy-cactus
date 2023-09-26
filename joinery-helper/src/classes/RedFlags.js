export default class RedFlags {
    constructor(JoineryHelper) {
        this.jh = JoineryHelper
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
}