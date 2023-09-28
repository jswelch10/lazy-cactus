export default class Storage {
    constructor() {

        this.user = null

        chrome.storage.local.get('user').then(res => {
            this.user = res.user
        })


    }
    async sendDataToStorage(state){
        let {changeLog} = state
        let data = {}
        let updatedData = {}
        changeLog.forEach((item) => {
            data[item.workOrderNum] = item.changeLogData;
        });

        if (state.debugMode) console.log("data arr: ", data);

        chrome.storage.local.get("joineryHelper")
            .then((res) => {

                if (state.debugMode) console.log("response from local storage: ", res);

                if(Object.keys(data).length !== 0) Object.keys(data).forEach(key => {
                    if(!Object.keys(res.joineryHelper).length > 0 // if storage is not empty
                        && res.joineryHelper.hasOwnProperty(key)) { // and if we have the key stored : merge the items

                        if (state.debugMode) console.log("merging data: ", key);

                        updatedData[key] = [...new Set([...res.joineryHelper[key], ...data[key]])];

                    } else {

                        updatedData[key] = data[key];

                    }
                });

                if (state.debugMode) console.log("updated data: ", {...res.joineryHelper, ...updatedData});

                chrome.storage.local.set({"joineryHelper": {...res.joineryHelper, ...updatedData}})
                    .catch(e => console.error("failed to set storage: ", e))
                    // .finally(() => state.changeLog = []);
            })
            .catch(e => {
                if (state.debugMode) console.log("failed to get storage: ", e)
            });
    }

    async clearStorage(state){
        if (!confirm("This action will clear your current JoineryHelper report data")) return;
        chrome.storage.local.set({"joineryHelper": {}}).then(e => {
            if (state.debugMode) console.log("reset storage")
        });
    }
    async exportAndLogStorage() {
        console.clear();

        const name = this.user.substring(0, this.user.indexOf("."));
        const date = new Date()
        const time =  date.toLocaleString('en-us', {hour12: false}).replace(",", "");
        let csvString = 'Date,Workorder,Who,Level,Errors\n';

        console.log('***** CHANGE LOG *****');

        chrome.storage.local.get("joineryHelper").then((res) => {

            Object.keys(res.joineryHelper).forEach(key => {

                csvString += `${time},${key},${name},,"${res.joineryHelper[key].join(', ')}"\n`

            });
            console.log(csvString);
        }).catch(e => console.log("no changes to report"))
            .finally(() => {
                    console.log('***** CHANGE LOG END *****');
                    const blob = new Blob([csvString], {type: "text/csv"});
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.setAttribute("href", url);
                    a.setAttribute("download",
                        `change-log-${date.getMonth().toString()}-${date.getDay().toString()}.csv`);
                    a.click();
                    a.remove();
                }
            );


    }
}