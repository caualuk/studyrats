/** Programmatically sets a file `<input>`'s value -- used to swap in a cropped photo after the user picks the original. */
export function setInputFile(input: HTMLInputElement, file: File) {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
}
