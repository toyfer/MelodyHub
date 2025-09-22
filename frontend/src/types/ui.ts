export interface UIUpdater {
  setDuration: () => void;
  updateProgress: () => void;
  updatePlayPauseButton: () => void;
  updateVolumeButton: () => void;
  updateVolume: () => void;
  updateNowPlaying: (song: string) => void;
  updatePlayingVisual: (song: string) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showPlayer: () => void;
  hidePlayer: () => void;
  hideNonPlayerSections: () => void;
  showAllSections: () => void;
  resetProgress: () => void;
}
