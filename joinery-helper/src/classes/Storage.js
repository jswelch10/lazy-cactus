export default class Storage {
    constructor() {

        this.user = null

        chrome.storage.local.get('user').then(res => {
            this.user = res.user
            console.log('user set in storage')
        })


    }
    async sendDataToStorage(state){
        console.log(state, 'state inside top of Storage.sendDataToStorage')
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
                    .catch(e => console.log("failed to set storage: ", e))
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
}