import path from "node:path";

export function storageRoot() {
  // project-local storage (dev). In prod, swap to cloud storage.
  return path.join(process.cwd(), "storage");
}

export function storedFilesRoot() {
  return path.join(storageRoot(), "files");
}

export function storedFilePath(storagePath: string) {
  return path.join(storedFilesRoot(), storagePath);
}

