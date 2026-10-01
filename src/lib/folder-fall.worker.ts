/// <reference lib="webworker" />
import { simulateFolderFall, type FolderFallOptions } from './folder-fall';

/** Runs the folder-rain physics off the main thread and hands back the recording. */
self.onmessage = (event: MessageEvent<FolderFallOptions>) => {
  const fall = simulateFolderFall(event.data);
  (self as DedicatedWorkerGlobalScope).postMessage(fall, [fall.frames.buffer]);
};
