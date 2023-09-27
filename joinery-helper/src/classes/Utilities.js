export default class Utilities {
    static processArtDimensions(string) {
        const roundEighthFloor = value => {
            if (value < 0) return 0
            let current = 0
            while (current <= value){
                current += .125
            }
            return current - .125;
        }

        string = string.replaceAll(/[wh'" ]/g, '')
        const dimensions = string.split('x');
        return [roundEighthFloor(parseFloat(dimensions[0])), roundEighthFloor(parseFloat(dimensions[1]))];
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


}