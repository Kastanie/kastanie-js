/**
 * App component
 */
class AppComponent {
  /**
   * Constructor
   * @param {string} id HTML element ID
   */

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

  /**
   * Returns any component
   * @param {string} id ID of an HTML element or component
   * @returns {AppComponent} Component
   */
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

  /**
   * Single object initialization
   * @param {object} obj
   */
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
        //TODO: Extend the view function
        if ("view" in obj) {
          component.view = obj.view;
        }
      } else {
        console.error("Object with ID " + id + " does not exist.");
      }
    }
  }

  /**
   * Component initialization
   */
  init() {
    //Overwritten by child classes
  }

  /**
   * Callback when the component enters or leaves the viewport
   * @param {float} intersectionRatio Value between 0 (not in viewport) and 1 (fully in viewport)
   */
  _intersect(intersectionRatio) {
    //Overwritten by derived classes
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

  /**
   * Activates the component as soon as it enters the viewport
   */
  activate() {
    //Runs when the component appears
    this.render();
  }

  /**
   * Deactivates the component as soon as it leaves the viewport
   */
  deactivate() {
    //Runs when the component disappears
  }

  /**
   * Registers a global listener
   * @param {string} eventName Event name
   * @param {function} listener Listener function
   */
  register(eventName, listener) {
    AppNotifier.register(this.id, eventName, listener);
  }

  /**
   * Unregisters a global listener
   * @param {string} eventName Event name
   */
  unregister(eventName) {
    AppNotifier.unregister(this.id, eventName);
  }

  /**
   * Triggers a global event
   * @param {string} eventName 
   * @param {Object} params 
   */
  trigger(eventName, params) {
    AppNotifier.notify(eventName, params);
  }

  /**
   * Returns the component data
   * @returns {object} Component data
   */
  get data() {
    return this._data;
  }

  /**
   * Sets the data
   * @param {object} value New data object
   */
  set data(value) {
    this._data = value;
    this.update();
  }

  /**
   * Refreshes the view
   */
  update() {
    this.rendered = false;
    this.render();
  }

  /**
   * Renders the component
   * If a view attribute already exists, the view is rendered
   */
  render() {
    if (!this.rendered) {
      if (this.view) {
        this.stageObj.innerHTML = this.view.render(this._data);
      } else if (typeof this.data === "string") {
        this.stageObj.innerHTML = this.data;
      }
      this.rendered = true;
      //Initialize subcomponents
      AppComponentController.init();
      AppDictionary.update();
      this.afterRender();
    }
  }

  afterRender() {
    //Called after rendering and can be used by child classes
  }
}
