export default class Storage {
    constructor(JoineryHelper) {
        this.jh = JoineryHelper
    }
    init() {
        //this function is UI/Storage
        this.setupUI();

        chrome.storage.local.get("user").then(res => {
            this.user = res.user
        });

        this.getPageRefs();

        const setupRow = document.querySelector(".data-grid-table-row");

        //this code is needed to initialize the sidebar for a proper scan
        setupRow.click();
        this.fieldsTab.click();
        setupRow.click();
    }
    async reset() {
        //storage/UI/state
        const tableGridRows = document.querySelectorAll(".data-grid-table-row");
        tableGridRows.forEach(row =>{
            row.style.removeProperty('background-color');
            row.style.removeProperty('color');
        });
        this.appState.toBeFixedLog = [];
        this.appState.toBeDARedLog = [];
        this.appState.changeLog = [];

    }
    async report() {
        /*	1. any tab can send scanned data error logs
            2. get and combine new errors into master error log file
            3. save new master error log
            4.

            1. report button sends request to local storage
            2. takes response and turns it into csv
            3. immediately downloads master csv

        */
        console.clear();
        const name = this.user.substring(0, this.user.indexOf("."));
        const date = new Date().toLocaleString('en-us',{hour12:false}).replace(",","");
        let csvString = 'Date,Workorder,Who,Level,Errors\n';

        console.log('***** CHANGE LOG *****');

        chrome.storage.local.get("joineryHelper").then((res) => {

            Object.keys(res.joineryHelper).forEach(key => {

                csvString +=`${date},${key},${name},,"${res.joineryHelper[key].join(', ')}"\n`

            });
            console.log(csvString);
        }).catch(() => console.log("no changes to report"))
            .finally(()=> {
                    console.log('***** CHANGE LOG END *****');
                    const blob = new Blob([csvString], {type: "text/csv"});
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.setAttribute("href", url);
                    a.setAttribute("download", "change-log.csv");
                    a.click();
                    a.remove();
                }
            );






    }
    async sendDataToStorage(){
        let data = {}
        let updatedData = {}
        this.appState.changeLog.forEach((item) => {
            data[item.workOrderNum] = item.fixes;
        });
        if (this.appState.debugMode) console.log("data arr: ", data);
        chrome.storage.local.get("joineryHelper")
            .then((res) => {

                if (this.appState.debugMode) console.log("response from local storage: ", res);

                if(Object.keys(data).length !== 0) Object.keys(data).forEach(key => {
                    if(!Object.keys(res.joineryHelper).length > 0 // if storage is not empty
                        && res.joineryHelper.hasOwnProperty(key)) { // and if we have the key stored : merge the items
                        if (this.appState.debugMode) console.log("merging data: ", key);
                        updatedData[key] = [...new Set([...res.joineryHelper[key], ...data[key]])];

                    } else {

                        updatedData[key] = data[key];

                    }
                });
                if (this.appState.debugMode) console.log("updated data: ", {...res.joineryHelper, ...updatedData});
                chrome.storage.local.set({"joineryHelper": {...res.joineryHelper, ...updatedData}})
                    .catch(e => console.log("failed to set storage: ", e))
                    .finally(() => this.appState.changeLog = []);
            })
            .catch(e => {
                if (this.appState.debugMode) console.log("failed to get storage: ", e)
            });
    }
    async clearStorage(){
        if (!confirm("This action will clear your current JoineryHelper report data")) return;
        chrome.storage.local.set({"joineryHelper": {}}).then(() => {
            if (this.appState.debugMode) console.log("reset storage")
        });
    }
}