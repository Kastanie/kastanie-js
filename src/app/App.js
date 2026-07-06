/**
 * AppController
 */
class App {
  constructor() {
    window.app = this;
    AppFactory.markReady();
    this.screenController = new AppScreenController();
    this.loadDictionary();
  }


  /**
   * Load the dictionary
   * @private
   */
  loadDictionary() {
    var controller = this;
    //Load the dictionary
    new AppDictionary(
      "./app/data/dictionary.json?v="  + Math.random(),
      function () {
        controller.init();
      }
    );
  }

  /**
   * Returns the current screen
   * @returns {HTMLElement} Current screen
   */
  static get screen() {
    var sc = window.app.screenController;
    return sc.screens[sc.current];
  }

  /**
   * Initializes the app
   * @private
   */
  init() {
    //Initialize the screens
    this.screenController.init();
    AppComponentController.init();
    this.start();
  }

  /**
   * Starts the app
   * @private
   */
  start() {
    AppDictionary.update();
    //Set the current screen
    console.log("Starting app");
    this.screenController.show();
  }
}
