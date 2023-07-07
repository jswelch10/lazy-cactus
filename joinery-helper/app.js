console.log('app.js loaded');
function getJoineryHelperInstance (){
	fetch(chrome.runtime.getURL('index.html'))
		.then(r => r.text())
		.then(html => {
			document.body.insertAdjacentHTML("beforeend", html)
		})
		.then(() => {
			return new JoineryHelper();
		})
}

const jh = getJoineryHelperInstance();
