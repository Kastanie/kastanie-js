/**
 * Activates elements that enter the viewport
 * @example
 * AppViewportObserver.register(document.getElementById("myElement"));
 */
class AppViewportObserver {
    /**
     * Constructor
     */
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

    /**
     * Registers an element
     * @param {DOM-Element} element Element
     */
    static register(element) {
        var result = false;
        if(AppViewportObserver.instance.observer )
        {
            AppViewportObserver.instance.observer.observe(element);
            result = true;
        }
        return result;
    }

    /**
     * Creates the observer once
     */
    createObserver() {
        let observer;

        let options = {
            root: null,
            rootMargin: "0px",
            threshold: this.buildThresholdList()
        };
        if ('IntersectionObserver' in window) {
            //@see https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
            observer = new IntersectionObserver(this.handleIntersect, options);
        }
        return observer;
    }

    /**
     * Callback for the intersection
     */
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

    /**
     * Splits the viewport into tenths from 1 to 0
     */
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
//Instantiates itself automatically so elements can be registered immediately
new AppViewportObserver();
