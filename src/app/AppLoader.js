/**
 * Loads JSON files.
 * @example 
 * AppLoader.load(
 * "/data/example.json",
 * function (data) {
 *   console.log("Loaded:", data);
 * },
 * function (progress) {
 *   console.log(progress.loaded, progress.total, progress.percent);
 * },
 * function (err) {
 *   console.error("Error:", err);
 *  }
 * );
 */
class AppLoader {
  /**
   * Initializes or returns the global data cache.
   *
   * @returns {Map<string, object>}
   */
  static getCache() {
    if (!(window.datacache instanceof Map)) {
      window.datacache = new Map();
    }

    return window.datacache;
  }

  /**
   * Loads a JSON file.
   *
   * @param {string} url URL to load as JSON
   * @param {function} loaded Function called after a successful load
   * @param {function} progress Function used to trigger progress
   * @param {function} error Function called when loading fails
   * @param {boolean} reload Indicates whether the cache should be ignored
   * @returns {Promise<object>}
   */
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

  /**
   * Reads a JSON response with progress information.
   *
   * @param {Response} response Fetch response
   * @param {function} progress Progress callback
   * @returns {Promise<object>}
   */
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

  /**
   * Combines multiple Uint8Array chunks into one Uint8Array.
   *
   * @param {Uint8Array[]} chunks
   * @returns {Uint8Array}
   */
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
