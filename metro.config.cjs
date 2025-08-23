const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push("cjs");
config.resolver.unstable_enablePackageExports = false;

// Symbolication hatalarını önle
config.symbolicator = {
  customizeFrame: (frame) => {
    // InternalBytecode.js hatalarını filtrele
    if (frame.file && frame.file.includes("InternalBytecode.js")) {
      return null;
    }
    return frame;
  },
};

// Server middleware'ını basitleştir
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // InternalBytecode.js isteklerini sessizce reddet
      if (req.url && req.url.includes("InternalBytecode.js")) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("File not found");
        return;
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
