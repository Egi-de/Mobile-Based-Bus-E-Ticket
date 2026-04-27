const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block react-native-maps on web platform
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('./components/MapViewWeb.web.tsx'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;