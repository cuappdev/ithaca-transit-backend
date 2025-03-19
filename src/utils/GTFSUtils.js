import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const TCAT_NY_US = "tcat-ny-us";
let gtfsData = [];

function getGTFSData() {
  return gtfsData;
}

function fetchGTFS() {
  gtfsData = []; // Reset the data
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const filePath = path.join(__dirname, "..", "..", `${TCAT_NY_US}/routes.txt`);
  const csvFile = fs.readFileSync(filePath, "utf8");
  const lines = csvFile.split("\n").filter((line) => line.trim() !== "");
  const columnNames = lines[0].split(",");

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");
    const route = {};
    columnNames.forEach((column, index) => {
      route[column] = row[index];
    });
    gtfsData.push(route);
  }
}

export default {
  fetchGTFS,
  getGTFSData,
};
