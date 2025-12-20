import { useEffect, useState } from "react";
import { Color, Icon, List } from "@raycast/api";
import { Entry } from "../lib/entry";
import { getGitBranch } from "../lib/git";
import { showFailureToast } from "@raycast/utils";
import { showGitBranch } from "../lib/preferences";
import ColorHash from "color-hash";

const colorHash = new ColorHash({ saturation: 0.7, lightness: 0.6 });

export interface EntryItemProps extends Pick<List.Item.Props, "icon" | "accessoryIcon" | "actions"> {
  entry: Entry;
}

function useGitBranch(path: string) {
  const [branch, setBranch] = useState<string | null>(null);

  useEffect(() => {
    if (showGitBranch) {
      async function fetchGitBranch() {
        if (path) {
          try {
            const branch = await getGitBranch(path);
            setBranch(branch);
          } catch (error) {
            showFailureToast(error, {
              title: "Failed to get Git branch",
            });
          }
        }
      }

      fetchGitBranch();
    }
  }, [path]);

  return branch;
}

export const EntryItem = ({ entry, ...props }: EntryItemProps) => {
  const branch = useGitBranch(entry.path);

  const accessories: List.Item.Accessory[] = [];

  if (entry.isOpen) {
    accessories.push({
      tag: { value: "Open", color: Color.Green },
    });
  }

  if (branch) {
    accessories.push({
      tag: branch,
      icon: { source: "git-branch.svg", tintColor: Color.SecondaryText },
      tooltip: `Git Branch: ${branch}`,
    });
  }

  return (
    <List.Item
      title={entry.title}
      subtitle={entry.subtitle}
      accessories={accessories}
      icon={entry.is_remote ? "remote.svg" : { source: Icon.Dot, tintColor: colorHash.hex(entry.title) }}
      {...props}
    />
  );
};
