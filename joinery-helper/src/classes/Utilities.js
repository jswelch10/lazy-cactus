/*
*
*
*/


export default class Utilities {

    static roundEighthFloor (value) {
        if (value < 0) return 0
        let current = 0
        while (current <= value){
            current += .125
        }
        return current - .125;
    }
    static mathChecksOut(data) {
        if(!data.isDimensionFlagged) return true;

        const {measurements} = data;

        if(data.isNoMatOrFloat) {
            return (measurements.artWidth === measurements.matOpeningWidth && measurements.artHeight === measurements.matOpeningHeight);
        } else {
            return (measurements.artWidth - .25) === measurements.matOpeningWidth && (measurements.artHeight - .25) === measurements.matOpeningHeight;
        }
    }
    static processArtDimensions(string) {
        string = string.replaceAll(/[wh'" ]/g, '')
        const dimensions = string.split('x');
        return [this.roundEighthFloor(parseFloat(dimensions[0])), this.roundEighthFloor(parseFloat(dimensions[1]))];
    }
    static changeOpeningValues(width, height, modifier) {
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
}