export type EntryRow = {
  id: string;
  title: string;
  category: string;
  visibility: string;
  seriesKey: string | null;
  versionNote: string | null;
  createdAt: Date;
  file: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    category: string;
    visibility: string;
  };
};

export function groupDocumentSeries(entries: EntryRow[]): {
  seriesKey: string;
  category: string;
  displayTitle: string;
  versions: EntryRow[];
}[] {
  const map = new Map<string, EntryRow[]>();
  for (const row of entries) {
    const key = row.seriesKey?.trim();
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }

  const out: {
    seriesKey: string;
    category: string;
    displayTitle: string;
    versions: EntryRow[];
  }[] = [];

  for (const [seriesKey, versions] of map) {
    versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const latest = versions[0];
    if (!latest) continue;
    out.push({
      seriesKey,
      category: latest.category,
      displayTitle: latest.title,
      versions,
    });
  }

  out.sort((a, b) => a.displayTitle.localeCompare(b.displayTitle));
  return out;
}

export function serializeEntry(e: EntryRow) {
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    visibility: e.visibility,
    seriesKey: e.seriesKey,
    versionNote: e.versionNote,
    createdAt: e.createdAt.toISOString(),
    file: e.file,
  };
}
