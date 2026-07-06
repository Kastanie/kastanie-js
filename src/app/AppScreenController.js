/**
 * Initializes and manages screens
 */
class AppScreenController {

  /**
   * Constructor
   * @private
   */
  constructor() {
    //Current screen or start screen
    this.current = "start";
    //Collects all screens that exist in the app
    this.screens = {};
  }

  /**
   * Initialization
   * @private
   */
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
      //Allows switching by event
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

  /**
   * Returns the current screen
   * @static
   * @returns {string} Current screen ID
   */
  static getCurrentScreen() {
    let hash = PeterParameter.getHashParam(0);
    if (hash in AppScreenController.getInstance().screens) {
      return hash;
    }
    return "start";
  }

  /**
   * Shows a screen
   * @param {string} id Screen-ID
   */
  static show(id) {
    if( !id )
    {
      id = AppScreenController.getCurrentScreen();
    }
    AppScreenController.getInstance().show(id);
  }

  /**
   * Shows a screen
   * @private
   * @param {string} id Screen-ID
   */
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

  /**
   * Hides all screens except the current one
   * @private
   */
  hideAll() {
    for (var id in this.screens) {
      if (id != this.current) {
        this.screens[id].classList.add("hidden");
      }
    }
  }
}
