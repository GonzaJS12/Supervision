import Constants from "expo-constants";

function hostDelBundler() {
  const uri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    "";

  return uri.replace(/^https?:\/\//, "").split("/")[0].split(":")[0] || "";
}

export const API_URL = (() => {
  const host = hostDelBundler();

  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:3000`;
  }

  return (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
})();
