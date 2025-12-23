import { getPreferenceValues } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";
import { homedir } from "os";

export type ZedBuild = Preferences["build"];
export type ZedBundleId = "dev.zed.Zed" | "dev.zed.Zed-Preview" | "dev.zed.Zed-Dev";

const ZedBundleIdBuildMapping: Record<ZedBuild, ZedBundleId> = {
  Zed: "dev.zed.Zed",
  "Zed Preview": "dev.zed.Zed-Preview",
  "Zed Dev": "dev.zed.Zed-Dev",
};

const ZedDbNameMapping: Record<ZedBuild, string> = {
  Zed: "0-stable",
  "Zed Preview": "0-preview",
  "Zed Dev": "0-dev",
};

export function getZedBundleId(build: ZedBuild): ZedBundleId {
  return ZedBundleIdBuildMapping[build];
}

export function getZedDbName(build: ZedBuild): string {
  return ZedDbNameMapping[build];
}

export function getZedDbPath() {
  const preferences = getPreferenceValues<Preferences>();
  const zedBuild = preferences.build;
  return `${homedir()}/Library/Application Support/Zed/db/${getZedDbName(zedBuild)}/db.sqlite`;
}

const ZedProcessNameMapping: Record<ZedBundleId, string> = {
  "dev.zed.Zed": "Zed",
  "dev.zed.Zed-Preview": "Zed Preview",
  "dev.zed.Zed-Dev": "Zed Dev",
};

/**
 * Closes a Zed window by its title (project name).
 * Uses System Events to click the window's close button directly.
 */
export async function closeZedWindow(windowTitle: string, bundleId: ZedBundleId): Promise<boolean> {
  const processName = ZedProcessNameMapping[bundleId];
  const escapedTitle = windowTitle.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const script = `
tell application "System Events"
  tell process "${processName}"
    repeat with w in (every window)
      if name of w contains "${escapedTitle}" then
        click (first button of w whose description is "close button")
        return "true"
      end if
    end repeat
    return "false"
  end tell
end tell
`;

  try {
    const result = await runAppleScript(script);
    return result === "true";
  } catch (error) {
    console.error("Failed to close Zed window:", error);
    return false;
  }
}
