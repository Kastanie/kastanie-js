import.meta.glob(
  ["./**/*.css", "!./**/__*.css", "!./**/__*/**"],
  { eager: true },
);

const moduleFiles = import.meta.glob(
  [
    "./app/**/*.js",
    "./modules/**/*.js",
    "!./app/**/__*.js",
    "!./app/**/__*/**",
    "!./modules/**/__*.js",
    "!./modules/**/__*/**",
  ],
  { eager: true },
);

const classes = new Map();

for (const moduleExports of Object.values(moduleFiles)) {
  for (const [name, exportedValue] of Object.entries(moduleExports)) {
    const isClass =
      typeof exportedValue === "function" &&
      /^class\s/.test(Function.prototype.toString.call(exportedValue));

    if (!isClass) {
      continue;
    }
    if (classes.has(name) && classes.get(name) !== exportedValue) {
      throw new Error(`Duplicate class export: ${name}`);
    }
    classes.set(name, exportedValue);
  }
}

const App = classes.get("App");
const AppFactory = classes.get("AppFactory");

if (!App || !AppFactory) {
  throw new Error("App and AppFactory must be exported by the app modules.");
}

for (const [name, classRef] of classes) {
  AppFactory.register(name, classRef);
}

const build = Object.freeze({
  version: __APP_VERSION__,
  number: __BUILD_NUMBER__,
  label: __BUILD_VERSION__,
});

new App(build);
