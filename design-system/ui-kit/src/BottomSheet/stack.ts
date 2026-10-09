type BottomSheetEntry = {
  close: () => void;
};

const entries: BottomSheetEntry[] = [];

export const registerBottomSheet = (entry: BottomSheetEntry): (() => void) => {
  entries.push(entry);

  return () => {
    const index = entries.indexOf(entry);

    if (index >= 0) {
      entries.splice(index, 1);
    }
  };
};

export const closeTopBottomSheet = (): boolean => {
  const entry = entries[entries.length - 1];

  if (!entry) {
    return false;
  }

  entry.close();

  return true;
};
