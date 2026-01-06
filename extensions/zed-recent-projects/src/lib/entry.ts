import { dirname, basename } from "path";
import tildify from "tildify";
import { Workspace, ZedWorkspaceType } from "./workspaces";

export interface Entry {
  id: number;
  path: string;
  uri: string;
  title: string;
  subtitle: string;
  type: ZedWorkspaceType;
  isOpen?: boolean;
  allPaths?: string[];
  wsl?: { user: string | null; distro: string | null } | null;
}

export function getEntry(workspace: Workspace): Entry | null {
  try {
    let title: string;
    let subtitle: string;

    const suffix = workspace.wsl
      ? ` [WSL: ${workspace.wsl.distro}]`
      : workspace.type === "remote"
        ? " [SSH: " + workspace.host + "]"
        : "";

    // Handle multi-folder workspaces
    if (workspace.allPaths && workspace.allPaths.length > 1) {
      const folderNames = workspace.allPaths.map((p) => decodeURIComponent(basename(p)));
      title = folderNames.join(", ");
      subtitle = tildify(dirname(workspace.allPaths[0])) + suffix;
    } else {
      title = decodeURIComponent(basename(workspace.path)) || workspace.path;
      subtitle = tildify(dirname(workspace.path)) + suffix;
    }

    return {
      id: workspace.id,
      type: workspace.type,
      path: workspace.path,
      uri: workspace.uri,
      title,
      subtitle,
      isOpen: workspace.isOpen,
      allPaths: workspace.allPaths,
      wsl: workspace.wsl,
    };
  } catch {
    return null;
  }
}
