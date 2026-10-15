const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const nativeEventEmitterWeb = path.resolve(
  projectRoot,
  "shims/NativeEventEmitter.web.js",
);

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

const resolverPorDefecto = config.resolver.resolveRequest;
config.resolver.resolveRequest = (contexto, nombreModulo, plataforma) => {
  if (nombreModulo === "react-native-web/dist/exports/NativeEventEmitter") {
    return { type: "sourceFile", filePath: nativeEventEmitterWeb };
  }

  if (resolverPorDefecto) {
    return resolverPorDefecto(contexto, nombreModulo, plataforma);
  }

  return contexto.resolveRequest(contexto, nombreModulo, plataforma);
};

module.exports = config;
