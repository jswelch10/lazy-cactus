export default class UserInterface {
    constructor(JoineryHelper, tabsToSetup, btnsToSetup) {
        this.jh = JoineryHelper
        this.updateAppState = false
        this.blastShield = false
        this.refs = {}

        this.setupPageRefs()
        this.setupInputWatcher()
        this.setupUITabs(tabsToSetup)
        this.setupUIButtons(btnsToSetup)
        this.makeUIDraggable()
    }
    setupPageRefs() {

        this.refs.fieldsTab = document.querySelector('[aria-label="Work Order Fields"]');
        this.refs.workflowTab = document.querySelector('[aria-label="Workflow"]');
        this.refs.saveButtonRef = document.querySelector('.work-order-form-save-popup > button');
        this.refs.widthInputRef = document.getElementById('input_45');
        this.refs.heightInputRef = document.getElementById('input_46');
        this.refs.blastShieldRef = document.getElementById("jh-blast-shield");
        this.refs.workOrderNumRef = document.querySelector("#tab-content-5 .production-info tr:nth-child(4) td:last-child");
        this.refs.artDimensionsRef = document.querySelector(".artwork-info > div:last-of-type");
        this.refs.workOrderInstructionsRef = document.getElementById('input_40');

        this.refs.borderT = document.getElementById('input_272')

        // this.workflowTab.click();
    }

    setupInputWatcher(){
        const func = this.appStateChanged
        Array.from(document.querySelectorAll("#JoineryHelper input")).forEach( input => {
            input.onchange = func.bind(this);
        });
    }

    setupUITabs(tabsToSetup) {
        const tabNames = tabsToSetup
        const tabs = Array.from(document.getElementsByClassName('jh-tab-btn'));
        const contents = Array.from(document.getElementsByClassName('jh-tab-content'));

        tabNames.forEach(name => {

            const tab = document.getElementById(`jh-${name}-tab`);
            const content = document.getElementById(`jh-${name}-content`);

            tab.addEventListener("click", () => {
                if (tab.classList.contains('active')) return

                tabs.forEach(item => item.classList.remove("active"));
                contents.forEach(item => item.classList.remove("selected"));

                tab.classList.add("active");
                content.classList.add("selected");

            })
        });
    }

    setupUIButtons(btnArr) {

        btnArr.forEach( name => {
            const btn = document.getElementById(`jh-${name}Btn`)

            btn.onclick = this.jh.getBtnFunc(name).bind(this.jh);
        })

    }

    get appSettings(){
        /*  TODO:
         *    excludedWorkOrders needs a more robust string manipulation to handle user errors
         */
        return {
            "scanSettings": {
                "target": document.querySelector("input[name='radio-scan']:checked").value,
                "excludedWorkOrders": [...document.getElementById('jh-excluded').value.split(' ')],
            },
            "fixSettings": {
                "target": document.querySelector("input[name='radio-fix']:checked").value
            },
            "darSettings": {
                "target": document.querySelector("input[name='radio-dar']:checked").value
            },
            "debugMode": document.querySelector("input[name='jh-debug']").checked
        }
    }

    getRows(state, tab) {
        //TODO rework to take target settings into account
        // tabs: scan, fix, flags, dar
        const allRows = Array.from(document.querySelectorAll(".data-grid-table-row"));
        const selectedRows = allRows.filter(row => row.querySelector('.md-checked'));
        const rowsEqual = allRows.length === selectedRows.length;
        const checkAll = document.querySelector('.data-grid-header md-checkbox');

        let rows
        switch(tab) { //scan, fix, flags, dar
            case "scan" :
                // sets rows to [rowElement, ...]
                if(state.scanSettings.target === 'all') {
                    rows = allRows;
                } else {
                    rows = selectedRows
                }
                break;

            case "fix" :
                // sets rows to [{data}, ...]
                if(state.fixSettings.target === 'yellows') {

                    if (state.debugMode) console.log("to be fixed log: ", state.toBeFixedLog);

                    rows = [...state.toBeFixedLog].filter(data => !data.isMessageFlagged);

                    if (state.debugMode) console.log("sending these to the job Interval: ", rows);

                } else {
                    if (state.debugMode) console.log("fixing selected items");
                    let arr = [];

                    [...selectedRows].forEach(row =>
                        arr.push(state.toBeFixedLog.find(data => data.workOrderNum === row.dataset.workorderNum))
                    );
                    rows = arr.filter(item => item !== undefined);
                    if (state.debugMode) console.log("selected items arr: ", rows);

                }
                break;

            case "flags" :
                rows = selectedRows.map(row => {
                    return {row}
                });
                break;

            case "dar" :
                // sets rows to [{data}, ...] or [{row}, ...]
                if(state.darSettings.target === 'greens') {
                    rows = [...state.toBeDARedLog]
                    if (state.debugMode) console.log("green items arr: ", rows);
                } else {
                    rows = selectedRows.map(row => {
                        return {row};
                    });

                }
                break;

        }
        checkAll.click();
        if (!rowsEqual) checkAll.click();


        if (rows.length !== 0) return rows;
        return [];

    }
    appStateChanged () {
        if (this.jh.appState.debugMode) console.log("state changed some more");
        if(!this.updateAppState) this.updateAppState = true;

    }
    toggleBlastShield() {
        document.getElementById('jh-excluded').blur();
        if (this.jh.appState.debugMode) console.log('blast shield toggled', this.refs.blastShieldRef);
        this.blastShield = !this.blastShield
        this.refs.blastShieldRef.classList.toggle("active");
        document.getElementById("jh-in-progress-content").classList.toggle("active")
        document.querySelector(".jh-content .selected").classList.toggle("loading");
    }
    makeUIDraggable() {
        let pos1, pos2, pos3, pos4
        const joinery = document.getElementById('JoineryHelper')

        joinery.onmousedown = e => {
            e.preventDefault()
            pos3 = e.clientX
            pos4 = e.clientY
            joinery.onmousemove = e => {
                e.preventDefault()
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                joinery.style.top = `${joinery.offsetTop - pos2}px`;
                joinery.style.left = `${joinery.offsetLeft - pos1}px`;
            }
            joinery.onmouseup = e => {
                joinery.onmousemove = null
                joinery.onmouseup = null
            }
        }

        document.getElementById('jh-excluded').onmousedown = (e) => e.stopPropagation();
    }
}