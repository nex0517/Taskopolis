import { useRef, type ChangeEvent } from 'react';

import './SaveControls.css';

interface SaveControlsProps {
  /** Called with the downloaded file's contents so the app can build it. */
  onExport: () => void;
  /** Called with the picked file's text; the app validates it. */
  onImport: (fileText: string) => void;
}

function SaveControls({ onExport, onImport }: SaveControlsProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImport(String(reader.result));
    reader.readAsText(file);
    event.target.value = ''; // allow re-importing the same file
  }

  return (
    <div className="save-controls">
      <button type="button" onClick={onExport}>
        Export save
      </button>
      <button type="button" onClick={() => fileInput.current?.click()}>
        Import save
      </button>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        onChange={handleFile}
        hidden
      />
    </div>
  );
}

export default SaveControls;
