import { closeMainWindow, getApplications, getPreferenceValues, popToRoot, showToast, Toast, open } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";
import { exec } from "child_process";
import { homedir } from "os";
import { promisify } from "util";
import type { Entry } from "./entry";
import { isMac, isWindows } from "./utils";
import { zedBuild } from "./preferences";

const execAsync = promisify(exec);

export type ZedBuild = Preferences["build"];
export type ZedBundleId = "dev.zed.Zed" | "dev.zed.Zed-Preview" | "dev.zed.Zed-Dev";

const ZedBundleIdBuildMapping: Record<ZedBuild, { macos: ZedBundleId; windows: { name: string } }> = {
  Zed: { macos: "dev.zed.Zed", windows: { name: "Zed" } },
  "Zed Preview": { macos: "dev.zed.Zed-Preview", windows: { name: "Zed Preview" } },
  "Zed Dev": { macos: "dev.zed.Zed-Dev", windows: { name: "Zed Dev" } },
};

const ZedDbNameMapping: Record<ZedBuild, string> = {
  Zed: "0-stable",
  "Zed Preview": "0-preview",
  "Zed Dev": "0-dev",
};

const ZedCliMapping: Record<ZedBuild, string> = {
  Zed: "zed",
  "Zed Preview": "zed-preview",
  "Zed Dev": "zed-dev",
};

export function getZedBundleId(build: ZedBuild): ZedBundleId {
  return ZedBundleIdBuildMapping[build].macos;
}

export function getZedWindowsMetadata(build: ZedBuild): { name: string } {
  return ZedBundleIdBuildMapping[build].windows;
}

export function getZedDbName(build: ZedBuild): string {
  return ZedDbNameMapping[build];
}

export function getZedDbPath() {
  const preferences = getPreferenceValues<Preferences>();
  const zedBuild = preferences.build;
  if (isMac) {
    return `${homedir()}/Library/Application Support/Zed/db/${getZedDbName(zedBuild)}/db.sqlite`;
  } else {
    return `${homedir()}\\AppData\\Local\\Zed\\db\\${getZedDbName(zedBuild)}\\db.sqlite`;
  }
}

export async function getZedApp() {
  const applications = await getApplications();
  const zedBundleId = getZedBundleId(zedBuild);
  const windowsMetadata = getZedWindowsMetadata(zedBuild);

  const app = applications.find((a) => {
    if (isMac) {
      return a.bundleId === zedBundleId;
    }
    if (isWindows) {
      return a.name === windowsMetadata.name;
    }
  });

  return app;
}

export function getZedCli(build: ZedBuild): string {
  return ZedCliMapping[build];
}

export async function openMultiFolderInZed(entry: Entry, build: ZedBuild): Promise<void> {
  if (!entry.allPaths || entry.allPaths.length <= 1) {
    throw new Error("Not a multi-folder workspace");
  }

  const cli = getZedCli(build);
  const paths = entry.allPaths.map((p) => `"${p}"`).join(" ");

  try {
    await execAsync(`command -v ${cli} > /dev/null 2>&1`);
    execAsync(`${cli} ${paths} > /dev/null 2>&1 &`);
    await popToRoot();
    await closeMainWindow();
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "Zed CLI not found",
      message: "Opening first folder only. Install CLI via Zed > Install CLI",
    });
    const bundleId = getZedBundleId(build);
    await open(entry.uri, bundleId);
    await popToRoot();
    await closeMainWindow();
  }
}

const ZedProcessNameMapping: Record<ZedBundleId, string> = {
  "dev.zed.Zed": "Zed",
  "dev.zed.Zed-Preview": "Zed Preview",
  "dev.zed.Zed-Dev": "Zed Dev",
};

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
