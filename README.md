# Kastanie JS

Kastanie JS is a small browser-based JavaScript engine for simple single-page applications. The framework has no external dependencies and combines hash-based routing, automatically initialized components, views, a lightweight event system, and a dictionary for replaceable texts.

## Project Structure

```text
src/
  index.html              app entry point
  version.txt             current build version
  app/                    framework core classes
  modules/                app modules, components, and views

dist/
  index.html              built HTML file
  app/kastanie.js         aggregated JavaScript
  app/styles.css          aggregated CSS
  app/data/dictionary.json
```

Files or folders whose names start with `__` are ignored during the build. This is useful for drafts, backups, or temporarily disabled modules.

## Build

Run the build with the shell script:

```sh
./build.sh
```

The script:

- increments the version number in `src/version.txt`
- aggregates and minifies JavaScript files into `dist/app/kastanie.js`
- aggregates and minifies CSS files into `dist/app/styles.css`
- copies `src/index.html` to `dist/index.html`
- replaces `[version]` in the built HTML file
- automatically registers detected JavaScript classes with `AppFactory.register("ClassName", ClassName)`

Files from `src/app` are included in a fixed order. All JavaScript files from `src/modules` are appended afterwards.

## App Start

The app is included and started in `src/index.html`:

```html
<script src="./app/kastanie.js?v=[version]"></script>
<link rel="stylesheet" href="./app/kastanie.css?v=[version]" />

<script>
  const app = new App();
</script>
```

During the build, `[version]` is replaced with the current version number. This helps bypass browser caches after a build.

Note: In the built `dist/index.html`, the build script changes the CSS reference to `./app/styles.css`, because CSS files are aggregated there.

## Screens and Routing

Screens are defined as `section` elements. The `section` ID is also the hash used for routing:

```html
<section id="start">
  <h1>Start</h1>
  <a href="#details">Show details</a>
</section>

<section id="details" class="hidden">
  <h1>Details</h1>
  <a href="#start">Back</a>
</section>
```

`AppScreenController` manages screens automatically. When the URL hash changes, the matching screen is shown. All other screens receive the `hidden` class.

## Components

Components are bound to HTML elements with the `data-component` attribute:

```html
<div id="example" data-component="Example"></div>
```

On startup, `AppComponentController` looks for all elements with `data-component`, creates the matching class through `AppFactory`, and passes the element ID to the constructor.

A component extends `AppComponent`:

```js
class Example extends AppComponent {
  init() {
    this.data = {
      name: "Example",
    };
  }

  activate() {
    super.activate();
  }

  deactivate() {
    console.log("Example deactivated", this.id);
  }
}
```

Important methods:

- `init()` is called after the component is created
- `activate()` is called when the component enters the viewport
- `deactivate()` is called when the component leaves the viewport
- `render()` renders the data or the assigned view
- `afterRender()` is called after rendering

Components become active only after `AppViewportObserver` detects them in the viewport.

## Components with Views

Views separate presentation from component logic. A view is assigned with `data-view`:

```html
<div id="example" data-component="Example" data-view="ExampleView"></div>
```

The component provides data:

```js
class Example extends AppComponent {
  init() {
    this.data = {
      name: "Example",
    };
  }
}
```

The view renders that data:

```js
class ExampleView {
  render(data) {
    return "This is an example for a component: " + data.name;
  }
}
```

When `render()` is executed on the component, `AppComponent` automatically calls `this.view.render(this._data)` and writes the result into the associated DOM element.

## Events

Components can register, trigger, and unregister global events:

```js
class Example extends AppComponent {
  init() {
    this.register("someEvent", function (data) {
      console.log("someEvent was triggered", data);
    });
  }

  activate() {
    this.trigger("someEvent", { value: 1 });
  }

  deactivate() {
    this.unregister("someEvent");
  }
}
```

Internally, this uses `AppNotifier`.

## Dictionary

The dictionary is used to manage texts centrally and output them depending on the selected language. By default, the app loads:

```text
./app/data/dictionary.json
```

A simple dictionary file looks like this:

```json
{
  "languages": ["de", "en"],
  "data": {
    "close": {
      "de": "schliessen",
      "en": "close"
    },
    "headline": {
      "de": "Ueberschrift",
      "en": "Heading"
    }
  }
}
```

Texts can be replaced directly in HTML through attributes:

```html
<h1 data-dictionary="headline">Fallback headline</h1>
<button data-dictionary="close">Close</button>
<img src="logo.png" data-dictionary-alt="logo_alt" alt="Logo" />
```

Supported attributes:

- `data-dictionary` replaces the content of an element
- `data-dictionary-aria` replaces the `aria-label`
- `data-dictionary-alt` replaces the `alt` attribute
- `data-dictionary-title` replaces the `title` attribute

After components are rendered, `AppDictionary.update()` is called automatically. This also updates newly created elements with dictionary attributes.

Texts can also be read directly in JavaScript:

```js
const label = AppDictionary.read("close");
```

The current language can be changed:

```js
AppDictionary.language("en");
AppDictionary.update();
```

Parameters in dictionary texts are written with percent signs:

```json
{
  "data": {
    "welcome": {
      "en": "Welcome, %name%!"
    }
  }
}
```

```js
const text = AppDictionary.read("welcome", { name: "Ada" });
```

Multiple variants of a text can be separated with `||`. The dictionary then selects one variant randomly:

```json
{
  "data": {
    "greeting": {
      "en": "Hello||Hi||Welcome"
    }
  }
}
```

## Creating New Modules

New modules belong in `src/modules`. A typical structure is:

```text
src/modules/my-module/
  MyComponent.js
  views/
    MyComponentView.js
  my-module.css
```

As long as files and folders do not start with `__`, they are included automatically during the build. Classes are automatically registered with `AppFactory` in the built JavaScript.

## Notes

- Class names must be unique.
- The value of `data-component` must match the component class name.
- The value of `data-view` must match the view class name.
- Components should extend `AppComponent`.
- Views need a `render(data)` method.
- Dictionary files must be available at runtime under `dist/app/data/dictionary.json`.
