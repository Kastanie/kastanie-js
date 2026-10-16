import "./app/app.css";
import "./modules/example/example.css";

import { App } from "./app/App.js";
import { AppComponent } from "./app/AppComponent.js";
import { AppComponentController } from "./app/AppComponentController.js";
import { AppDictionary } from "./app/AppDictionary.js";
import { AppFactory } from "./app/AppFactory.js";
import { AppLoader } from "./app/AppLoader.js";
import { AppNotifier } from "./app/AppNotifier.js";
import { AppScreenController } from "./app/AppScreenController.js";
import { AppViewportObserver } from "./app/AppViewportObserver.js";
import { Example } from "./modules/example/Example.js";
import { ExampleView } from "./modules/example/views/ExampleView.js";
import { Version } from "./modules/version/Version.js";
import { VersionView } from "./modules/version/views/VersionView.js";

const classes = {
  App,
  AppComponent,
  AppComponentController,
  AppDictionary,
  AppFactory,
  AppLoader,
  AppNotifier,
  AppScreenController,
  AppViewportObserver,
  Example,
  ExampleView,
  Version,
  VersionView,
};

for (const [name, classRef] of Object.entries(classes)) {
  AppFactory.register(name, classRef);
}

const build = Object.freeze({
  version: __APP_VERSION__,
  number: __BUILD_NUMBER__,
  label: __BUILD_VERSION__,
});

new App(build);
