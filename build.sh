#!/bin/sh

set -eu

SRC_DIR="src"
DIST_DIR="dist"
APP_DIST_DIR="$DIST_DIR/app"
VERSION_FILE="$SRC_DIR/version.txt"
JS_OUT="$APP_DIST_DIR/kastanie.js"
CSS_OUT="$APP_DIST_DIR/styles.css"

if [ ! -f "$VERSION_FILE" ]; then
  echo "Version file not found: $VERSION_FILE" >&2
  exit 1
fi

old_version=$(sed 's/[^0-9]//g' "$VERSION_FILE")
if [ -z "$old_version" ]; then
  echo "Version file must contain a number: $VERSION_FILE" >&2
  exit 1
fi

version=$((old_version + 1))
mkdir -p "$APP_DIST_DIR"

minify_js() {
  awk '
    BEGIN { in_block = 0 }
    {
      line = $0

      while (1) {
        if (in_block) {
          end = index(line, "*/")
          if (end == 0) {
            line = ""
            break
          }
          line = substr(line, end + 2)
          in_block = 0
        }

        start = index(line, "/*")
        if (start == 0) {
          break
        }

        end = index(substr(line, start + 2), "*/")
        if (end == 0) {
          line = substr(line, 1, start - 1)
          in_block = 1
          break
        }

        line = substr(line, 1, start - 1) substr(line, start + end + 3)
      }

      sub(/^[[:space:]]+/, "", line)
      sub(/[[:space:]]+$/, "", line)

      if (line ~ /^\/\// || line == "") {
        next
      }

      print line
    }
  ' "$1"
}

minify_css() {
  awk '
    BEGIN { in_block = 0 }
    {
      line = $0

      while (1) {
        if (in_block) {
          end = index(line, "*/")
          if (end == 0) {
            line = ""
            break
          }
          line = substr(line, end + 2)
          in_block = 0
        }

        start = index(line, "/*")
        if (start == 0) {
          break
        }

        end = index(substr(line, start + 2), "*/")
        if (end == 0) {
          line = substr(line, 1, start - 1)
          in_block = 1
          break
        }

        line = substr(line, 1, start - 1) substr(line, start + end + 3)
      }

      sub(/^[[:space:]]+/, "", line)
      sub(/[[:space:]]+$/, "", line)

      if (line != "") {
        printf "%s", line
      }
    }
    END { printf "\n" }
  ' "$1" |
  sed \
    -e 's/[[:space:]][[:space:]]*/ /g' \
    -e 's/ *{ */{/g' \
    -e 's/ *} */}/g' \
    -e 's/ *: */:/g' \
    -e 's/ *; */;/g' \
    -e 's/ *, */,/g'
}

get_class_name() {
  sed -n 's/.*class[[:space:]][[:space:]]*\([A-Za-z_$][A-Za-z0-9_$]*\).*/\1/p' "$1" |
  sed -n '1p'
}

append_registration() {
  class_name="$1"
  printf 'AppFactory.register("%s", %s);\n' "$class_name" "$class_name" >> "$JS_TMP"
}

JS_TMP="$JS_OUT.tmp"
CSS_TMP="$CSS_OUT.tmp"
HTML_TMP="$DIST_DIR/index.html.tmp"

: > "$JS_TMP"
APP_FACTORY_READY=0
PENDING_REGISTRATIONS=""

for app_file in \
  AppNotifier \
  AppFactory \
  AppScreenController \
  AppComponentController \
  AppLoader \
  AppDictionary \
  AppViewportObserver \
  AppComponent \
  App
do
  js_file="$SRC_DIR/app/$app_file.js"
  if [ ! -f "$js_file" ]; then
    echo "Required app file not found: $js_file" >&2
    exit 1
  fi

  minify_js "$js_file" >> "$JS_TMP"
  printf '\n' >> "$JS_TMP"

  class_name=$(get_class_name "$js_file")
  if [ -n "$class_name" ]; then
    if [ "$app_file" = "AppFactory" ]; then
      append_registration "$class_name"
      APP_FACTORY_READY=1
      if [ -n "$PENDING_REGISTRATIONS" ]; then
        printf '%s' "$PENDING_REGISTRATIONS" | while IFS= read -r pending_class; do
          if [ -n "$pending_class" ]; then
            append_registration "$pending_class"
          fi
        done
        PENDING_REGISTRATIONS=""
      fi
    elif [ "$APP_FACTORY_READY" -eq 1 ]; then
      append_registration "$class_name"
    else
      PENDING_REGISTRATIONS="${PENDING_REGISTRATIONS}${class_name}
"
    fi
  fi

  printf '\n' >> "$JS_TMP"
done

find "$SRC_DIR/modules" -type f -name '*.js' ! -name '__*' ! -path '*/__*/*' | sort | while IFS= read -r js_file; do
  minify_js "$js_file" >> "$JS_TMP"
  printf '\n' >> "$JS_TMP"

  class_name=$(get_class_name "$js_file")
  if [ -n "$class_name" ]; then
    append_registration "$class_name"
  fi

  printf '\n' >> "$JS_TMP"
done

: > "$CSS_TMP"
find "$SRC_DIR" -type f -name '*.css' ! -name '__*' ! -path '*/__*/*' | sort | while IFS= read -r css_file; do
  minify_css "$css_file" >> "$CSS_TMP"
done

sed \
  -e "s/\[version\]/$version/g" \
  -e 's#\./app/kastanie\.css#./app/styles.css#g' \
  "$SRC_DIR/index.html" > "$HTML_TMP"

mv "$JS_TMP" "$JS_OUT"
mv "$CSS_TMP" "$CSS_OUT"
mv "$HTML_TMP" "$DIST_DIR/index.html"
printf '%s\n' "$version" > "$VERSION_FILE"

echo "Built version $version"
