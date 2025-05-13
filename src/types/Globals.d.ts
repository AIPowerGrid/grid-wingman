declare module '*.module.css';

// Type definitions for File System Access API
// Minimal set to support showOpenFilePicker
interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
  // createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>; // Add if you plan to use saving
}

interface FilePickerOptions {
  types?: Array<{
    description?: string;
    accept: Record<string, string | string[]>;
  }>;
  multiple?: boolean;
  excludeAcceptAllOption?: boolean;
  id?: string;
  startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | FileSystemHandle;
}

interface Window {
  showOpenFilePicker?(options?: FilePickerOptions): Promise<FileSystemFileHandle[]>;
  // showSaveFilePicker?(options?: FilePickerOptions): Promise<FileSystemFileHandle>; // Add if needed
  // showDirectoryPicker?(options?: FilePickerOptions): Promise<FileSystemDirectoryHandle>; // Add if needed
}
