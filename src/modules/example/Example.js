/**
 * Sample component
 * @example
 * <div data-component="Example" data-view="ExampleView" id="example1"></div>
 */
class Example extends AppComponent {
    /**
     * Automatic component initialization
     */
    init() {
        this.data = {
            name: "Example",
        };
        //Register events
        this.register("someEvent", function (data) {
            console.log("someEvent was triggered", data);
        });
    }



    /**
     * Automatic component activation as soon as it enters the viewport
     */
    activate() {
        console.log("Example activated", this.id);
        super.activate();
        //Example: trigger an event
        this.unregister("someEvent");

    }

    /**
     * Deactivates the component as soon as it leaves the viewport
     */
    deactivate() {
        console.log("Example deactivated", this.id);
    }
}
