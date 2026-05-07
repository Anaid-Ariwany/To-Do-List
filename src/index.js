require('./style.css');

const { createStore } = require('./state/store');
const { loadState } = require('./storage/storage');
const { mountApp } = require('./ui/dom');

const initialState = loadState();
const store = createStore(initialState);

mountApp(document.getElementById('app'), store);
