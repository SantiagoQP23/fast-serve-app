export default {
  expo: {
    name: "Teikio",
    slug: "fast-serve-app",
    version: "1.0.0",
    orientation: "default",
    icon: "./assets/images/icon.png",
    scheme: "teikio",
    userInterfaceStyle: "light",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.teikio.app",
    },

    android: {
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      softwareKeyboardLayoutMode: "pan",

      adaptiveIcon: {
        backgroundColor: "#ffffff",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },

      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.teikio.app",
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      "@react-native-google-signin/google-signin",
      "expo-iap",
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-secure-store",
      "expo-font",
      "expo-notifications",
      "@react-native-community/datetimepicker",
      "expo-localization",
      "expo-web-browser",
      "expo-image",
      "expo-sharing",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: false,
    },

    extra: {
      router: {},
      eas: {
        projectId: "b9621fca-38f8-49b2-8f41-3cece844f1d2",
      },
    },
  },
};
