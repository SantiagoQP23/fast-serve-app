const { withAndroidManifest } = require("expo/config-plugins");

// Libraries imply hardware features Play then treats as required: the printer
// libraries' wifi permissions imply android.hardware.wifi, and ML Kit's
// portrait-locked barcode scanner activity implies screen.portrait. Declaring
// them optional keeps the app installable on tablets, Chromebooks and XR.
const OPTIONAL_FEATURES = [
  "android.hardware.wifi",
  "android.hardware.screen.portrait",
];

module.exports = function withOptionalHardwareFeatures(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const features = (manifest["uses-feature"] ??= []);

    for (const name of OPTIONAL_FEATURES) {
      const existing = features.find((f) => f.$["android:name"] === name);
      if (existing) existing.$["android:required"] = "false";
      else features.push({ $: { "android:name": name, "android:required": "false" } });
    }

    return config;
  });
};
