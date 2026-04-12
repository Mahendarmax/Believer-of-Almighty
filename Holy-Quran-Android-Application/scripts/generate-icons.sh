#!/bin/bash
# Generate Android adaptive icon PNGs from source PNG using ImageMagick
# Usage: bash scripts/generate-icons.sh

set -e

ICON_PNG="Holy-Quran.png"
ANDROID_RES="android/app/src/main/res"

# Android mipmap sizes: mdpi=48, hdpi=72, xhdpi=96, xxhdpi=144, xxxhdpi=192
declare -A SIZES=(
  ["mdpi"]=48
  ["hdpi"]=72
  ["xhdpi"]=96
  ["xxhdpi"]=144
  ["xxxhdpi"]=192
)

# Foreground layer sizes for adaptive icons (108dp * density)
declare -A FG_SIZES=(
  ["mdpi"]=108
  ["hdpi"]=162
  ["xhdpi"]=216
  ["xxhdpi"]=324
  ["xxxhdpi"]=432
)

echo "Generating launcher icons from $ICON_PNG..."

for density in "${!SIZES[@]}"; do
  size=${SIZES[$density]}
  fg_size=${FG_SIZES[$density]}
  dir="$ANDROID_RES/mipmap-${density}"
  mkdir -p "$dir"

  convert "$ICON_PNG" -resize "${size}x${size}" "$dir/ic_launcher.png"
  convert "$ICON_PNG" -resize "${size}x${size}" "$dir/ic_launcher_round.png"
  convert "$ICON_PNG" -resize "${fg_size}x${fg_size}" "$dir/ic_launcher_foreground.png"

  echo "  Created ${density} icons (${size}x${size}, fg ${fg_size}x${fg_size})"
done

# Create adaptive icon XML files
DRAWABLE_V26="$ANDROID_RES/mipmap-anydpi-v26"
mkdir -p "$DRAWABLE_V26"

cat > "$DRAWABLE_V26/ic_launcher.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
EOF

cat > "$DRAWABLE_V26/ic_launcher_round.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
EOF

# Remove any standalone ic_launcher_background.xml to avoid duplicate resource errors
rm -f "$ANDROID_RES/values/ic_launcher_background.xml"

# Create background color resource
VALUES_DIR="$ANDROID_RES/values"
mkdir -p "$VALUES_DIR"

if ! grep -q "ic_launcher_background" "$VALUES_DIR/colors.xml" 2>/dev/null; then
  if [ -f "$VALUES_DIR/colors.xml" ]; then
    sed -i 's|</resources>|    <color name="ic_launcher_background">#0d4735</color>\n</resources>|' "$VALUES_DIR/colors.xml"
  else
    cat > "$VALUES_DIR/colors.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0d4735</color>
</resources>
EOF
  fi
fi

echo "Icon generation complete!"
