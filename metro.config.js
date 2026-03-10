const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const wsShimPath = path.resolve(__dirname, 'shims/ws.js');

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  ws: wsShimPath,
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'ws') {
    return {
      type: 'sourceFile',
      filePath: wsShimPath,
    };
  }

  if (typeof originalResolveRequest === 'function') {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
