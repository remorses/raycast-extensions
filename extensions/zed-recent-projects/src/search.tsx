import { Action, ActionPanel, Icon, List, open } from "@raycast/api";
import { useZedContext, withZed } from "./components/with-zed";
import { exists } from "./lib/utils";
import { Entry, getEntry } from "./lib/entry";
import { EntryItem } from "./components/entry-item";
import { usePinnedEntries } from "./hooks/use-pinned-entries";
import { useRecentWorkspaces } from "./hooks/use-recent-workspaces";
import { Workspace } from "./lib/workspaces";

export function Command() {
  const { app, dbPath, workspaceDbVersion } = useZedContext();
  const { workspaces, isLoading, error, removeEntry, removeAllEntries, revalidate } = useRecentWorkspaces(
    dbPath,
    workspaceDbVersion,
  );
  const { pinnedEntries, pinEntry, unpinEntry, unpinAllEntries, moveUp, moveDown } = usePinnedEntries();

  const pinned = Object.values(pinnedEntries)
    .filter((e) => e.type === "remote" || exists(e.uri))
    .sort((a, b) => a.order - b.order);

  const zedIcon = { fileIcon: app.path };

  const openEntry = async (workspace: Workspace) => {
    await open(workspace.uri, app);
    setTimeout(revalidate, 200);
  };

  const removeAndUnpinEntry = async (entry: Pick<Entry, "id" | "uri">) => {
    await removeEntry(entry.id);
    unpinEntry(entry);
  };

  const removeAllAndUnpinEntries = async () => {
    await removeAllEntries();
    unpinAllEntries();
  };

  return (
    <List isLoading={isLoading}>
      <List.EmptyView
        title="No Recent Projects"
        description={error ? "Check that Zed is up-to-date" : undefined}
        icon="no-view.png"
      />
      <List.Section title="Pinned Projects">
        {pinned.map((entry) => {
          if (!entry) {
            return null;
          }

          return (
            <EntryItem
              key={entry.uri}
              entry={entry}
              actions={
                <ActionPanel>
                  <Action.Open title="Open in Zed" target={entry.uri} application={app} icon={zedIcon} />
                  {entry.type === "local" && <Action.ShowInFinder path={entry.path} />}
                  <Action
                    title="Unpin Entry"
                    icon={Icon.PinDisabled}
                    onAction={() => unpinEntry(entry)}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
                  />
                  {entry.order > 0 ? (
                    <Action
                      title="Move up"
                      icon={Icon.ArrowUp}
                      onAction={() => moveUp(entry)}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "arrowUp" }}
                    />
                  ) : null}
                  {entry.order < pinned.length - 1 ? (
                    <Action
                      title="Move Down"
                      icon={Icon.ArrowDown}
                      onAction={() => moveDown(entry)}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "arrowDown" }}
                    />
                  ) : null}
                  <RemoveActionSection
                    onRemoveEntry={() => removeAndUnpinEntry(entry)}
                    onRemoveAllEntries={removeAllAndUnpinEntries}
                  />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>

      <List.Section title="Recent Projects">
        {Object.values(workspaces)
          .filter((e) => !pinnedEntries[e.uri] && (e.type === "remote" || exists(e.uri)))
          .sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0))
          .map((workspace) => {
            const entry = getEntry(workspace);

            if (!entry) {
              return null;
            }

            return (
              <EntryItem
                key={entry.uri}
                entry={entry}
                actions={
                  <ActionPanel>
                    <Action title="Open in Zed" icon={zedIcon} onAction={() => openEntry(workspace)} />
                    {entry.type === "local" && <Action.ShowInFinder path={entry.path} />}
                    <Action
                      title="Pin Entry"
                      icon={Icon.Pin}
                      onAction={() => pinEntry(entry)}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
                    />
                    <RemoveActionSection
                      onRemoveEntry={() => removeAndUnpinEntry(entry)}
                      onRemoveAllEntries={removeAllAndUnpinEntries}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
      </List.Section>
    </List>
  );
}

function RemoveActionSection({
  onRemoveEntry,
  onRemoveAllEntries,
}: {
  onRemoveEntry: () => void;
  onRemoveAllEntries: () => void;
}) {
  return (
    <ActionPanel.Section>
      <Action
        icon={Icon.Trash}
        title="Remove from Recent Projects"
        style={Action.Style.Destructive}
        onAction={() => onRemoveEntry()}
        shortcut={{ modifiers: ["ctrl"], key: "x" }}
      />

      <Action
        icon={Icon.Trash}
        title="Remove All Recent Projects"
        style={Action.Style.Destructive}
        onAction={() => onRemoveAllEntries()}
        shortcut={{ modifiers: ["ctrl", "shift"], key: "x" }}
      />
    </ActionPanel.Section>
  );
}

export default withZed(Command);
