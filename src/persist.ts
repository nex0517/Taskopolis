// Browsers may clear site data when space runs low. Marking our storage as
// "persistent" asks them to spare the save; it is a hint, not a guarantee.
export function requestPersistentStorage(): void {
  if (!navigator.storage?.persist) return;
  void navigator.storage.persist();
}
