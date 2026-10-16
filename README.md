# Kastanie JS

Kastanie JS is a small browser-based JavaScript engine for simple single-page applications. The framework has no runtime dependencies and combines hash-based routing, automatically initialized components, views, a lightweight event system, and a dictionary for replaceable texts. Vite provides the development server and production build.

## Project Structure

```text
src/
  index.html              app entry point
  main.js                 module registration and app startup
  app/                    framework core classes
  modules/                app modules, components, and views

public/                   static files copied to dist by Vite

dist/                     generated production build
package.json              npm scripts and development dependencies
vite.config.js            Vite configuration
```

JavaScript and CSS files below `src/app` and `src/modules` are discovered automatically. Files and directories whose names start with `__` are excluded. Files from `public/` are copied without transformation.

## Development and Build

Install the development dependencies and start the local server:

```sh
npm install
npm run dev
```

Vite prints the local URL, usually `http://localhost:5173/`, and reloads the page when source files change.

Create and locally preview the production build:

```sh
npm run build
npm run preview
```

The production build is written to `dist/`. Vite bundles and minifies imported JavaScript and CSS, adds content hashes to generated assets, processes `src/index.html`, and copies `public/`.

Each production build increments the counter in `build-number.json`. The package version and build number are compiled into the application and can be read at runtime:

```js
window.app.build.version;
window.app.build.number;
window.app.build.label; // For example: "1.0.0+42"
```

Starting the development server does not increment the counter.

## App Start

`src/index.html` loads the module entry point:

```html
<script type="module" src="./main.js"></script>
```

`src/main.js` discovers application styles and classes, registers exported classes, and creates the `App` instance. Vite handles cache busting for generated JavaScript and CSS through content hashes.

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
import { AppComponent } from "../../app/AppComponent.js";

export class Example extends AppComponent {
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
import { AppComponent } from "../../app/AppComponent.js";

export class Example extends AppComponent {
  init() {
    this.data = {
      name: "Example",
    };
  }
}
```

The view renders that data:

```js
export class ExampleView {
  render(data) {
    return "This is an example for a component: " + data.name;
  }
}
```

When `render()` is executed on the component, `AppComponent` automatically calls `this.view.render(this._data)` and writes the result into the associated DOM element.

## Events

Components can register, trigger, and unregister global events:

```js
import { AppComponent } from "../../app/AppComponent.js";

export class Example extends AppComponent {
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
import { AppDictionary } from "./app/AppDictionary.js";

const label = AppDictionary.read("close");
```

The current language can be changed:

```js
import { AppDictionary } from "./app/AppDictionary.js";

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
import { AppDictionary } from "./app/AppDictionary.js";

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

Export new components and views as named classes. Vite discovers them automatically and registers each class under its export name:

```js
export class MyComponent extends AppComponent {
  // ...
}
```

CSS files below `src/app` and `src/modules` are included automatically. Prefix a file or directory with `__` to exclude it and its contents from development and production builds, for example `__MyDraft.js` or `__drafts/`.

## Notes

- Factory registration names must be unique.
- The value of `data-component` must match its `AppFactory` registration name.
- The value of `data-view` must match its `AppFactory` registration name.
- Components should extend `AppComponent`.
- Views need a `render(data)` method.
- Dictionary files belong in `public/app/data/` and are available at runtime under `app/data/`.
