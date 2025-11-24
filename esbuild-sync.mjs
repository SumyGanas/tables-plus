import fs from "fs";
import path from "path";

export const syncAssets = (targetDir) => ({
  name: "sync-assets",
  setup(build) {
    build.onEnd(() => {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.copyFileSync("manifest.json", path.join(targetDir, "manifest.json"));
      if (fs.existsSync("styles.css")) {
        fs.copyFileSync("styles.css", path.join(targetDir, "styles.css"));
      }
    });
  },
});