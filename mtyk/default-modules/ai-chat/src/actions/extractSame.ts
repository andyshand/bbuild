interface ExtractSameResult {
  start: string;
  end: string;
  a: string;
  b: string;
}

export const extractSame = (str1: string, str2: string): ExtractSameResult => {
  str1 = str1.trim();
  str2 = str2.trim();

  const str1Lines = str1.split('\n');
  const str2Lines = str2.split('\n');

  let sharedStart = '';
  let lineIndex = 0;
  while (str1Lines[lineIndex] === str2Lines[lineIndex]) {
    sharedStart += str1Lines[lineIndex] + '\n';
    lineIndex++;
  }

  let sharedEnd = '';
  let reverseLineIndex = 0;
  while (
    str1Lines[str1Lines.length - 1 - reverseLineIndex] ===
    str2Lines[str2Lines.length - 1 - reverseLineIndex]
  ) {
    sharedEnd = str1Lines[str1Lines.length - 1 - reverseLineIndex] + '\n' + sharedEnd;
    reverseLineIndex++;
  }

  const str1Remaining = str1Lines
    .slice(lineIndex, str1Lines.length - reverseLineIndex)
    .join('\n');
  const str2Remaining = str2Lines
    .slice(lineIndex, str2Lines.length - reverseLineIndex)
    .join('\n');

  return {
    start: sharedStart,
    end: sharedEnd,
    a: str1Remaining,
    b: str2Remaining,
  };
};
