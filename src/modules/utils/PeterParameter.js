/**
 * Static helper for providing parameters
 */
var PeterParameter = {
  /**
   * Returns a hash parameter
   * @param {int} index Parameter index
   * @returns {string} Parameter
   */
  getHashParam: function (index) {
    var result = null;
    var params = location.hash.substring(1).split("/");
    if (params.length > index) {
      result = params[index];
    }
    return result;
  },

  /**
   * Checks whether the parameter exists.
   * @param {string} param Parameter name or hash part
   * @returns {boolean}
   */
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

  /**
   * Returns a numeric list of all hash parameters
   * @returns {array} Numeric list of all hash parameters
   */
  getHashParams() {
    return location.hash.substring(1).split("/");
  },

  /**
   *
   * @returns {object} List of all URL parameters as an associative array
   */
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

  /**
   * Requests a URL parameter
   * @param {string} parameter URL parameter
   * @param {string} defaultvalue Default value if the parameter does not exist
   * @returns {string} Returned parameter value
   */
  getUrlParam: function (parameter, defaultvalue) {
    var urlparameter = defaultvalue;
    if (window.location.href.indexOf(parameter) > -1) {
      urlparameter = PeterParameter.getUrlParams()[parameter];
    }
    return urlparameter;
  },
};
