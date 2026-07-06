class AppNotifier {
constructor() {
this.listener = {};
this.trigger = {};
}
static getInstance() {
if (!AppNotifier.instance) {
AppNotifier.instance = new AppNotifier();
}
return AppNotifier.instance;
}
static exist(eventName) {
var result = false;
if (eventName in AppNotifier.getInstance().trigger) {
result = AppNotifier.getInstance().trigger[eventName];
}
return result;
}
static notify(eventName, params) {
if (eventName in AppNotifier.getInstance().listener) {
if (!(eventName in AppNotifier.getInstance().trigger)) {
AppNotifier.getInstance().trigger[eventName] = 0;
}
AppNotifier.getInstance().trigger[eventName]++;
var events = AppNotifier.getInstance().listener[eventName];
for (var id in events) {
if (params) {
params.event = eventName;
events[id](params);
} else {
events[id](eventName);
}
}
}
}
static register(id, eventName, listener) {
if (!(eventName in AppNotifier.getInstance().listener)) {
AppNotifier.getInstance().listener[eventName] = {};
}
if (!(id in AppNotifier.getInstance().listener[eventName])) {
AppNotifier.getInstance().listener[eventName][id] = listener;
}
}
static unregister(id, eventName) {
if (eventName in AppNotifier.getInstance().listener) {
if (id in AppNotifier.getInstance().listener[eventName]) {
delete AppNotifier.getInstance().listener[eventName][id];
}
}
}
}


class AppFactory {
static registry = new Map();
static pending = [];
static ready = false;
static register(type, classRef) {
this.registry.set(type, classRef);
this.flush();
}
static create(type, id) {
if (!this.ready) {
this.pending.push([type, id]);
return null;
}
return this.instantiate(type, id);
}
static instantiate(type, id) {
const ClassRef = this.registry.get(type);
if (!ClassRef) {
throw new Error(`Unknown component: ${type}`);
}
return id ? new ClassRef(id) : new ClassRef();
}
static markReady() {
this.ready = true;
this.flush();
}
static flush() {
if (!this.ready) return;
this.pending.forEach(([type, id]) => this.instantiate(type, id));
this.pending.length = 0;
}
}

AppFactory.register("AppFactory", AppFactory);
AppFactory.register("AppNotifier", AppNotifier);

class AppScreenController {
constructor() {
this.current = "start";
this.screens = {};
}
init() {
var controller = this;
this.current = "start";
var sections = document.getElementsByTagName("section");
var firstid = "";
for (var i = 0; i < sections.length; i++) {
var id = sections[i].getAttribute("id");
if (!id) {
id = makeid();
sections[i].setAttribute("id", id);
}
if (firstid == "") {
firstid = id;
}
AppNotifier.register("screens", id, function (screenid) {
location.hash = "#" + screenid;
});
this.screens[id] = sections[i];
}
if (!(this.current in this.screens)) {
this.current = firstid;
}
var param = PeterParameter.getHashParam(0);
if (param) {
if (param in this.screens) {
this.current = param;
}
}
document.body.classList.add(this.current);
this.hideAll();
this.screens[this.current].classList.remove("hidden");
window.addEventListener("hashchange", function (event) {
let hash = PeterParameter.getHashParam(0);
if (hash in controller.screens) {
controller.show(hash);
}
if (hash == "") {
controller.show("start");
}
});
}
static getCurrentScreen() {
let hash = PeterParameter.getHashParam(0);
if (hash in AppScreenController.getInstance().screens) {
return hash;
}
return "start";
}
static show(id) {
if( !id )
{
id = AppScreenController.getCurrentScreen();
}
AppScreenController.getInstance().show(id);
}
show(id) {
if (id != this.current && id in this.screens) {
if (this.current) {
document.body.classList.remove(this.current);
}
this.current = id;
document.body.classList.add(this.current);
this.hideAll();
if (!(id in this.screens[id])) {
this.screens[id].id = id;
}
this.screens[id].classList.remove("hidden");
}
}
hideAll() {
for (var id in this.screens) {
if (id != this.current) {
this.screens[id].classList.add("hidden");
}
}
}
}

AppFactory.register("AppScreenController", AppScreenController);

class AppComponentController {
constructor() {
this.components = new Array();
}
static getInstance() {
if (!this.instance) {
this.instance = new AppComponentController();
}
return this.instance;
}
static init() {
var elements = document.querySelectorAll("[data-component]:not(.inited)");
for (var i = 0; i < elements.length; i++) {
var element = elements[i];
if (!element.component) {
var id = element.getAttribute("id");
if (!element.hasAttribute("id")) {
id = makeid();
element.setAttribute("id", id);
}
var componentClass = element
.getAttribute("data-component")
.match(/[a-zA-Z]+/g)[0];
var component = null;
try {
component = AppFactory.create(componentClass, id);
} catch (e) {
if (e.toString().indexOf("ReferenceError") != -1) {
console.error("Class does not exist: ", componentClass);
} else {
console.error(
"A JavaScript error occurred while referencing the class, so it could not be initialized.",
componentClass
);
console.error(e);
}
}
if (component) {
AppComponentController.getInstance().components.push(component);
}
}
}
}
}

AppFactory.register("AppComponentController", AppComponentController);

class AppLoader {
static getCache() {
if (!(window.datacache instanceof Map)) {
window.datacache = new Map();
}
return window.datacache;
}
static async load(url, loaded, progress, error, reload = false) {
const cache = AppLoader.getCache();
if (!reload && cache.has(url)) {
const cachedData = cache.get(url);
if (typeof loaded === "function") {
loaded(cachedData);
}
return cachedData;
}
try {
const response = await fetch(url, {
method: "GET",
headers: {
"Accept": "application/json",
},
cache: reload ? "reload" : "default",
credentials: "same-origin",
});
if (!response.ok) {
throw new Error(`Error loading ${url}: ${response.status} ${response.statusText}`);
}
const data = typeof progress === "function"
? await AppLoader.readJsonWithProgress(response, progress)
: await response.json();
cache.set(url, data);
if (typeof loaded === "function") {
loaded(data);
}
return data;
} catch (err) {
console.error(err);
if (typeof error === "function") {
error(err);
}
throw err;
}
}
static async readJsonWithProgress(response, progress) {
const contentLength = response.headers.get("Content-Length");
const total = contentLength ? Number(contentLength) : 0;
if (!response.body) {
const data = await response.json();
progress({
loaded: total || 1,
total: total || 1,
lengthComputable: total > 0,
percent: total > 0 ? 100 : null,
});
return data;
}
const reader = response.body.getReader();
const chunks = [];
let loaded = 0;
while (true) {
const { done, value } = await reader.read();
if (done) {
break;
}
chunks.push(value);
loaded += value.byteLength;
progress({
loaded,
total,
lengthComputable: total > 0,
percent: total > 0 ? (loaded / total) * 100 : null,
});
}
const text = new TextDecoder("utf-8").decode(AppLoader.concatChunks(chunks));
return JSON.parse(text);
}
static concatChunks(chunks) {
const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
const result = new Uint8Array(totalLength);
let offset = 0;
for (const chunk of chunks) {
result.set(chunk, offset);
offset += chunk.length;
}
return result;
}
}

AppFactory.register("AppLoader", AppLoader);

let AppDictionaryInstance = null;
class AppDictionary {
constructor(url, onInited) {
if (!AppDictionaryInstance) {
AppDictionaryInstance = this;
var controller = this;
this.data = null;
this.languages = [];
this.currentlanguage = "de";
var storageLanguage = localStorage.getItem("appdictionarylanguage");
if (storageLanguage) {
this.currentlanguage = storageLanguage;
}
var storage = localStorage.getItem("appdictionarydata");
if (!storage) {
AppLoader.load(url, function (data) {
controller._onDictionaryLoaded(data);
if (typeof onInited == "function") {
onInited();
}
});
} else {
console.log("Loading dictionary from storage...");
if (!this.data)
{
this.data = new Array();
this.data = JSON.parse(storage);
}
var languagestorage = localStorage.getItem("appdictionarylanguages");
if (languagestorage) {
this.languages = JSON.parse(languagestorage);
}
if (typeof onInited == "function") {
onInited();
}
AppLoader.load(
url +
"?r=" +
Math.random()
.toString(36)
.replace(/[^a-z]+/g, "")
.substr(0, 5),
function (data) {
console.log("Dictionary reloaded...");
controller._onDictionaryLoaded(data);
}
);
}
AppNotifier.register("dictionary", "language", function (event) {
console.log(event);
var l = event._params;
if (l != controller.currentlanguage) {
AppDictionary.language(l);
AppDictionary.update();
}
});
}
}
getData(dictionaryID) {
var result = dictionaryID;
if (dictionaryID in this.data) {
var d = this.data[dictionaryID];
if (typeof d === "string") {
result = d;
} else {
if (this.currentlanguage in d) {
result = d[this.currentlanguage];
}
}
}
return result;
}
static getInstance(url) {
if (!AppDictionaryInstance) {
if (!url) {
url = "./app/data/dictionary.json";
}
AppDictionaryInstance = new AppDictionary(url);
}
return AppDictionaryInstance;
}
_onDictionaryLoaded(data) {
console.warn("Dictionary loaded");
this.data = data.data;
if ("languages" in data) {
this.languages = data.languages;
}
localStorage.setItem("appdictionarydata", JSON.stringify(this.data));
if (this.languages.length) {
localStorage.setItem(
"appdictionarylanguages",
JSON.stringify(this.languages)
);
}
}
static language(language) {
AppDictionary.getInstance().currentlanguage = language;
localStorage.setItem("appdictionarylanguage", language);
}
static update() {
var element = null;
var dicid = "";
var dictionaryElements = document.querySelectorAll("[data-dictionary]");
for (var i = 0; i < dictionaryElements.length; i++) {
element = dictionaryElements[i];
dicid = element.getAttribute("data-dictionary");
element.innerHTML = AppDictionary.read(dicid);
}
dictionaryElements = document.querySelectorAll("[data-dictionary-aria]");
for (var i = 0; i < dictionaryElements.length; i++) {
element = dictionaryElements[i];
dicid = element.getAttribute("data-dictionary-aria");
element.setAttribute("aria-label", AppDictionary.read(dicid));
}
dictionaryElements = document.querySelectorAll("[data-dictionary-alt]");
for (var i = 0; i < dictionaryElements.length; i++) {
element = dictionaryElements[i];
dicid = element.getAttribute("data-dictionary-alt");
element.setAttribute("alt", AppDictionary.read(dicid));
}
dictionaryElements = document.querySelectorAll("[data-dictionary-title]");
for (var i = 0; i < dictionaryElements.length; i++) {
element = dictionaryElements[i];
dicid = element.getAttribute("data-dictionary-title");
element.setAttribute("title", AppDictionary.read(dicid));
}
}
static read(dictionaryID, params = {}) {
var result = "";
if (dictionaryID in AppDictionary.getInstance().data) {
if (params) {
result = AppDictionary.setParams(
AppDictionary.shuffle(
AppDictionary.getInstance().getData(dictionaryID).split("||")
)[0],
params
);
} else {
result = AppDictionary.shuffle(
AppDictionary.getInstance().getData(dictionaryID).split("||")
)[0];
}
}
result = result.replace("\r\n", "<br/>");
return result;
}
static setParams(dictionaryItem, params) {
for (var param in params) {
console.log(param);
dictionaryItem = dictionaryItem
.split("%" + param + "%")
.join(params[param]);
}
return dictionaryItem;
}
static shuffle(array) {
var currentIndex = array.length,
temporaryValue,
randomIndex;
while (0 !== currentIndex) {
randomIndex = Math.floor(Math.random() * currentIndex);
currentIndex -= 1;
temporaryValue = array[currentIndex];
array[currentIndex] = array[randomIndex];
array[randomIndex] = temporaryValue;
}
return array;
}
}

AppFactory.register("AppDictionary", AppDictionary);

class AppViewportObserver {
constructor() {
if (!AppViewportObserver.instance) {
AppViewportObserver.instance = this;
AppViewportObserver.instance.observer = this.createObserver();
}
return AppViewportObserver.instance;
}
static get instance() {
return this._instance || 0;
}
static set instance(v) {
this._instance = v;
}
static register(element) {
var result = false;
if(AppViewportObserver.instance.observer )
{
AppViewportObserver.instance.observer.observe(element);
result = true;
}
return result;
}
createObserver() {
let observer;
let options = {
root: null,
rootMargin: "0px",
threshold: this.buildThresholdList()
};
if ('IntersectionObserver' in window) {
observer = new IntersectionObserver(this.handleIntersect, options);
}
return observer;
}
handleIntersect(entries, observer) {
entries.forEach((entry) => {
let target = entry.target;
if (entry.intersectionRatio > 0) {
target.classList.add('app-inviewport');
}
else {
target.classList.remove('app-inviewport');
}
if( "component" in target )
{
target.component._intersect(entry.intersectionRatio);
}
});
}
buildThresholdList() {
let thresholds = [];
let numSteps = 10;
for (let i = 1.0; i <= numSteps; i++) {
let ratio = i / numSteps;
thresholds.push(ratio);
}
thresholds.push(0);
return thresholds;
}
}
new AppViewportObserver();

AppFactory.register("AppViewportObserver", AppViewportObserver);

class AppComponent {
constructor(id) {
if (document.getElementById(id)) {
this.id = id;
this.active = false;
this.stageObj = document.getElementById(id);
this.stageObj.classList.add("inited");
this.stageObj.component = this;
this.view = null;
this._data = null;
this.rendered = false;
if (this.stageObj.hasAttribute("data-view")) {
var viewClass = this.stageObj.getAttribute("data-view");
this.view = AppFactory.create(viewClass);
}
AppViewportObserver.register(this.stageObj);
this.init();
}
}
static gime(id) {
var result = null;
var element = document.getElementById(id);
if (element) {
if ("component" in element) {
result = element.component;
}
}
return result;
}
static create(obj) {
if ("id" in obj) {
if (document.getElementById(id)) {
var component = new AppComponent(id);
if ("data" in obj) {
component._data = obj.data;
}
if ("init" in obj) {
component.init = function () {
obj.init();
};
component.init();
}
if ("activate" in obj) {
component.activate = function () {
obj.activate();
};
}
if ("view" in obj) {
component.view = obj.view;
}
} else {
console.error("Object with ID " + id + " does not exist.");
}
}
}
init() {
}
_intersect(intersectionRatio) {
if (intersectionRatio > 0 && !this.stageObj.classList.contains("active")) {
this.stageObj.classList.add("active");
this.active = true;
this.activate();
} else if (this.active && intersectionRatio <= 0) {
this.active = false;
this.stageObj.classList.remove("active");
this.deactivate();
}
}
activate() {
this.render();
}
deactivate() {
}
register(eventName, listener) {
AppNotifier.register(this.id, eventName, listener);
}
unregister(eventName) {
AppNotifier.unregister(this.id, eventName);
}
trigger(eventName, params) {
AppNotifier.notify(eventName, params);
}
get data() {
return this._data;
}
set data(value) {
this._data = value;
this.update();
}
update() {
this.rendered = false;
this.render();
}
render() {
if (!this.rendered) {
if (this.view) {
this.stageObj.innerHTML = this.view.render(this._data);
} else if (typeof this.data === "string") {
this.stageObj.innerHTML = this.data;
}
this.rendered = true;
AppComponentController.init();
AppDictionary.update();
this.afterRender();
}
}
afterRender() {
}
}

AppFactory.register("AppComponent", AppComponent);

class App {
constructor() {
window.app = this;
AppFactory.markReady();
this.screenController = new AppScreenController();
this.loadDictionary();
}
loadDictionary() {
var controller = this;
new AppDictionary(
"./app/data/dictionary.json?v="  + Math.random(),
function () {
controller.init();
}
);
}
static get screen() {
var sc = window.app.screenController;
return sc.screens[sc.current];
}
init() {
this.screenController.init();
AppComponentController.init();
this.start();
}
start() {
AppDictionary.update();
console.log("Starting app");
this.screenController.show();
}
}

AppFactory.register("App", App);

class Example extends AppComponent {
init() {
this.data = {
name: "Example",
};
this.register("someEvent", function (data) {
console.log("someEvent was triggered", data);
});
}
activate() {
console.log("Example activated", this.id);
super.activate();
this.unregister("someEvent");
}
deactivate() {
console.log("Example deactivated", this.id);
}
}

AppFactory.register("Example", Example);

class ExampleView {
render(data) {
return "This is an example for a component: " + data.name;
}
}

AppFactory.register("ExampleView", ExampleView);

var PeterParameter = {
getHashParam: function (index) {
var result = null;
var params = location.hash.substring(1).split("/");
if (params.length > index) {
result = params[index];
}
return result;
},
hasHashParam(param) {
var result = false;
var params = location.hash.substring(1).split("/");
for (var i = 0; i < params.length; i++) {
if (params[i].indexOf(param) != -1) {
result = true;
}
}
return result;
},
getHashParams() {
return location.hash.substring(1).split("/");
},
getUrlParams() {
var result = {};
var parts = window.location.href.replace(
/[?&]+([^=&]+)=([^&]*)/gi,
function (m, key, value) {
result[key] = value;
}
);
return result;
},
getUrlParam: function (parameter, defaultvalue) {
var urlparameter = defaultvalue;
if (window.location.href.indexOf(parameter) > -1) {
urlparameter = PeterParameter.getUrlParams()[parameter];
}
return urlparameter;
},
};


var ArrayUnique = function (array) {
var unique = new Array();
for (var i = 0; i < array.length; i++) {
var current = array[i];
if (unique.indexOf(current) == -1) {
unique.push(current);
}
}
return unique;
};
function sanatize(string) {
function strip(string) {
return stripHtml(string.replace(/^\s+|\s+$/g, ""));
}
function stripHtml(html) {
var tmp = document.createElement("DIV");
tmp.innerHTML = html;
return tmp.textContent || tmp.innerText || "";
}
return strip(string);
}
function makeid(length) {
if (!length) {
length = 10;
}
var result = "a";
var characters =
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var charactersLength = characters.length;
for (var i = 1; i < length; i++) {
result += characters.charAt(Math.floor(Math.random() * charactersLength));
}
return result;
}


