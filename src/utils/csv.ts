export const parseCSV = (fileContent: string | Buffer, csvSeparator: string = ","): Array<Array<string>> => {
  const fileContentString = Buffer.from(fileContent).toString();
  const csvRows = fileContentString.split("\n");
  return csvRows
    .map((csvRow) => csvRow.split(csvSeparator).map((cell) => cell.trim()))
    .filter((row) => row.some((cell) => cell !== ""));
};
