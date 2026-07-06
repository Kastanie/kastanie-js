/**
 * Global dictionary for exchanging strings, best used with the dictionary component
 * 
 * @usage <h1 data-dictionary="someDictionaryID">Heading</h1>
 * @usage AppDictionary.language("de");
 * @usage AppDictionary.update(); 
 */
let AppDictionaryInstance = null;

class AppDictionary {
  /**
   * Constructor
   */
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
        //Reload
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

  /**
   * Returns the matching dictionary entry
   * @param {string} dictionaryID Dictionary entry ID
   * @returns {string} Dictionary entry
   */
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

  /**
   * Returns an instance of the object
   */
  static getInstance(url) {
    if (!AppDictionaryInstance) {
      if (!url) {
        url = "./app/data/dictionary.json";
      }
      AppDictionaryInstance = new AppDictionary(url);
    }
    return AppDictionaryInstance;
  }

  /**
   * Triggers the onDictionaryInited event when the dictionary has loaded
   * @param {Object} data
   */
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
    //Replace text in elements
    var dictionaryElements = document.querySelectorAll("[data-dictionary]");
    for (var i = 0; i < dictionaryElements.length; i++) {
      element = dictionaryElements[i];
      dicid = element.getAttribute("data-dictionary");
      element.innerHTML = AppDictionary.read(dicid);
    }
    //Replace aria labels
    dictionaryElements = document.querySelectorAll("[data-dictionary-aria]");
    for (var i = 0; i < dictionaryElements.length; i++) {
      element = dictionaryElements[i];
      dicid = element.getAttribute("data-dictionary-aria");
      element.setAttribute("aria-label", AppDictionary.read(dicid));
    }
    //Replace alt texts
    dictionaryElements = document.querySelectorAll("[data-dictionary-alt]");
    for (var i = 0; i < dictionaryElements.length; i++) {
      element = dictionaryElements[i];
      dicid = element.getAttribute("data-dictionary-alt");
      element.setAttribute("alt", AppDictionary.read(dicid));
    }
    //Replace title texts
    dictionaryElements = document.querySelectorAll("[data-dictionary-title]");
    for (var i = 0; i < dictionaryElements.length; i++) {
      element = dictionaryElements[i];
      dicid = element.getAttribute("data-dictionary-title");
      element.setAttribute("title", AppDictionary.read(dicid));
    }
  }

  /**
   * Returns a term from the dictionary
   * @param {string} dictionaryID Dictionary ID
   * @returns {string} Text output
   */
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

  /**
   * Replaces parameters
   * @param {string} dictionaryItem String
   * @param {Object} params Parameter object
   */
  static setParams(dictionaryItem, params) {
    for (var param in params) {
      console.log(param);
      dictionaryItem = dictionaryItem
        .split("%" + param + "%")
        .join(params[param]);
    }
    return dictionaryItem;
  }

  /**
   * Shuffles dictionary entries
   * @param {Array} array Array of entries
   */
  static shuffle(array) {
    var currentIndex = array.length,
      temporaryValue,
      randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }
}
