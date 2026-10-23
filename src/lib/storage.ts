import { dataSchema, initialData, type Data } from "./model";
function open() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("gforce", 1);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains("records"))
        r.result.createObjectStore("records");
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function readData(): Promise<Data> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction("records", "readonly");
    const r = t.objectStore("records").get("personal");
    r.onsuccess = () => {
      try {
        resolve(
          r.result ? dataSchema.parse(r.result) : structuredClone(initialData),
        );
      } catch (e) {
        reject(e);
      }
    };
    r.onerror = () => reject(r.error);
    t.oncomplete = () => db.close();
  });
}
export async function writeData(data: Data) {
  dataSchema.parse(data);
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const t = db.transaction("records", "readwrite");
    t.objectStore("records").put(data, "personal");
    t.oncomplete = () => {
      db.close();
      resolve();
    };
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}
export async function clearData() {
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const t = db.transaction("records", "readwrite");
    t.objectStore("records").clear();
    t.oncomplete = () => {
      db.close();
      resolve();
    };
    t.onerror = () => reject(t.error);
  });
}
