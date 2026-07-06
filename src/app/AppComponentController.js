/**
 * Initializes and manages AppComponents
 */
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

  /**
   * Initialization
   */
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
