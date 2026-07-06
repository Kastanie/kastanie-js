/**
 * Global event system as a singleton
 */
class AppNotifier {
  /**
   * Constructor
   */
  constructor() {
    //Event stack
    this.listener = {};
    //Stores all events or triggers that have already been triggered
    this.trigger = {};
  }

  /**
   * Creates and returns the single instance
   * @returns {AppNotifier} Current and only instance
   */
  static getInstance() {
    if (!AppNotifier.instance) {
      AppNotifier.instance = new AppNotifier();
    }
    return AppNotifier.instance;
  }

  /**
   * Checks whether an event or trigger has already been fired
   * @param {string} eventName Name of an event/trigger
   * @returns {boolean, int} Returns false if the event is not in the stack yet, or the numeric number of event calls
   */
  static exist(eventName) {
    var result = false;
    if (eventName in AppNotifier.getInstance().trigger) {
      result = AppNotifier.getInstance().trigger[eventName];
    }
    return result;
  }

  /**
   * Triggers an event
   * @param {string} eventName Event name
   * @param {*} params Parameters, usually {object} or {string}
   */
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

  /**
   * Registers an event
   * @param {string} id ID of the element that registers the event
   * @param {string} eventName Event name
   * @param {function} listener
   */
  static register(id, eventName, listener) {
    if (!(eventName in AppNotifier.getInstance().listener)) {
      AppNotifier.getInstance().listener[eventName] = {};
    }
    if (!(id in AppNotifier.getInstance().listener[eventName])) {
      AppNotifier.getInstance().listener[eventName][id] = listener;
    }
  }

  /**
   * Unregisters an event
   * @param {string} id ID of the element that unregisters the event
   * @param {string} eventName Event name
   */
  static unregister(id, eventName) {
    if (eventName in AppNotifier.getInstance().listener) {
      if (id in AppNotifier.getInstance().listener[eventName]) {
        delete AppNotifier.getInstance().listener[eventName][id];
      }
    }
  }
}
