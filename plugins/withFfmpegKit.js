const { withProjectBuildGradle } = require('@expo/config-plugins');

/** Ensures ffmpeg-kit-react-native resolves package variant on Android prebuild. */
function withFfmpegKit(config) {
  return withProjectBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    if (!contents.includes('ffmpegKitPackage')) {
      if (/ext\s*\{/.test(contents)) {
        contents = contents.replace(/ext\s*\{/, "ext {\n        ffmpegKitPackage = 'min'");
      } else {
        contents = contents.replace(
          /buildscript\s*\{/,
          "buildscript {\n    ext {\n        ffmpegKitPackage = 'min'\n    }",
        );
      }
    }
    mod.modResults.contents = contents;
    return mod;
  });
}

module.exports = withFfmpegKit;
