console.log('app.js loaded');
function getJoineryHelperInstance (){
	fetch(chrome.runtime.getURL('index.html'))
		.then(r => r.text())
		.then(html => {
			document.body.insertAdjacentHTML("beforeend", html)
		})
		.then(() => {
			return chrome.runtime.id;
		})
		.then((e) => {
			console.log(e);
			// "eflomlhjhbnggmopdpccekfgjapdjdij"
			return new JoineryHelper(e);
		})
}

const jh = getJoineryHelperInstance();
