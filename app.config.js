import 'dotenv/config'

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'com.esmdev.TourneyAppMEU.dev';
  }

  if (IS_PREVIEW) {
    return 'com.esmdev.TourneyAppMEU.preview';
  }

  return 'com.esmdev.TourneyAppMEU';
};

const getAppName = () => {
  if (IS_DEV) {
    return 'Maine Ultimate (Dev)';
  }

  if (IS_PREVIEW) {
    return 'Maine Ultimate (Preview)';
  }

  return 'Maine Ultimate';
};

const getAndroidPackage = () => {
  if (IS_DEV) {
    return 'com.esmdev.TourneyAppMEU';
  }

  if (IS_PREVIEW) {
    return 'com.esmdev.TourneyAppMEU.preview';
  }

  return 'com.esmdev.TourneyAppMEU';
};

export default ({ config }) => {
  // Handle Google Services file
  let googleServicesFile = './google-services.json';
  
  return {
    ...config,
    name: getAppName(),
    ios: {
      ...config.ios,
      bundleIdentifier: getUniqueIdentifier(),
    },
    android: {
      ...config.android,
      package: getAndroidPackage(),
    },
    extra: {
      ...config.extra,
      eas: {
        ...config.extra?.eas,
        projectId: "16c193f8-cab3-49c3-afed-39fcf60c01b5"
      },
      appVariant: IS_DEV ? 'development' : IS_PREVIEW ? 'preview' : 'production'
    }
  };
}