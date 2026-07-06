/**
 * Array helper for removing duplicate entries
 * @param {Array} array Array with duplicate entries
 * @returns {Array} Cleaned array
 */
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


/**
 * Removes unwanted elements from a string
 * @param {string} string String to check
 * @returns {string} Cleaned string
 */
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

/**
 * Creates a random ID
 * @param {Number} length ID length
 * @returns {string} Random ID
 */
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
