import XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = process.argv[2];

const OUTPUT_FILE =
  process.argv[3] ||
  "data/processed/results.preview.csv";

const REQUIRED_COLUMNS = [
  "Name",
  "College Roll Number",
  "Study year",
  "Course code",
  "Course name",
  "Academic year",
  "Semester",
  "NPTEL Roll Number",
  "Assignment /25",
  "Exam /75",
  "Total /100",
  "Grade",
  "Topper band",
  "Pass status",
  "Certificate eligible",
  "Cert type",
  "Release status",
];

const toNumber = (value) => {
  if (value === null || value === undefined) return null;

  const cleaned = String(value)
    .trim()
    .replace(/^'+/, "")
    .replace(/,/g, "");

  if (!cleaned || !Number.isFinite(Number(cleaned))) {
    return null;
  }

  return Number(cleaned);
};

const escapeCSV = (value) => {
  if (value === null || value === undefined) return "";

  const text = String(value);

  return `"${text.replace(/"/g, '""')}"`;
};

const outputColumns = [
  "name",
  "college_roll_number",
  "study_year",
  "course_code",
  "course_name",
  "academic_year",
  "semester",
  "nptel_roll_number",
  "assignment_marks_25",
  "exam_marks_75",
  "total_marks_100",
  "grade",
  "topper_band",
  "pass_status",
  "certificate_eligible",
  "certificate_type",
  "department",
];

function processResults() {
  if (!INPUT_FILE) {
    throw new Error(
      "Please provide the Excel file path."
    );
  }

  if (!fs.existsSync(INPUT_FILE)) {
    throw new Error(
      `Excel file not found: ${INPUT_FILE}`
    );
  }

  console.log("Reading Excel workbook...");

  const workbook = XLSX.readFile(INPUT_FILE);

  if (!workbook.SheetNames.includes("Roster")) {
    throw new Error(
      'The workbook does not contain a "Roster" sheet.'
    );
  }

  const worksheet = workbook.Sheets["Roster"];

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });

  if (rows.length === 0) {
    throw new Error("The Roster sheet is empty.");
  }

  const availableColumns = Object.keys(rows[0]);

  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !availableColumns.includes(column)
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Missing Excel columns: ${missingColumns.join(", ")}`
    );
  }

  console.log(`Total Excel rows: ${rows.length}`);

    // Keep only released results with a final Pass or Fail status.
    const releasedRows = rows.filter((row) => {
    const releaseStatus = String(row["Release status"])
        .trim()
        .toLowerCase();

    const passStatus = String(row["Pass status"])
        .trim()
        .toLowerCase();

    return (
        releaseStatus === "released" &&
        ["pass", "fail"].includes(passStatus)
    );
    });

  // Diagnose study-year filtering
console.log("\nStudy Year Analysis:");

for (let year = 1; year <= 4; year++) {
  const count = releasedRows.filter(
    (row) => toNumber(row["Study year"]) === year
  ).length;

  console.log(`Year ${year}: ${count}`);
}

const invalidYearRows = releasedRows.filter((row) => {
  const year = toNumber(row["Study year"]);
  return !Number.isInteger(year) || year < 1 || year > 4;
});

console.log("Invalid/missing study years:", invalidYearRows.length);

// Keep all released Pass/Fail records,
// including records with missing or unusual study years.
const validYearRows = releasedRows;

console.log("Records after year filtering:", validYearRows.length);

  // Keep courses where at least one student has an exam mark.
  const activeCourses = new Set(
    validYearRows
      .filter((row) => toNumber(row["Exam /75"]) !== null)
      .map((row) => String(row["Course name"]).trim())
      .filter(Boolean)
  );

  const finalRows = validYearRows;

  const cleanedRows = finalRows.map((row) => ({
    name: String(row["Name"]).trim(),
    college_roll_number: String(
      row["College Roll Number"]
    ).trim(),
    study_year: toNumber(row["Study year"]) ?? "",
    course_code: String(row["Course code"]).trim(),
    course_name: String(row["Course name"]).trim(),
    academic_year: toNumber(row["Academic year"]),
    semester: String(row["Semester"]).trim(),
    nptel_roll_number: String(
      row["NPTEL Roll Number"]
    ).trim(),
    assignment_marks_25: toNumber(row["Assignment /25"]),
    exam_marks_75: toNumber(row["Exam /75"]),
    total_marks_100: toNumber(row["Total /100"]),
    grade: String(row["Grade"]).trim(),
    topper_band: String(row["Topper band"]).trim(),
    pass_status: String(row["Pass status"]).trim(),
    certificate_eligible: String(
      row["Certificate eligible"]
    ).trim(),
    certificate_type: String(row["Cert type"]).trim(),
    department: "",
  }));

  if (cleanedRows.length === 0) {
    throw new Error(
      "No records passed the cleaning rules. Output not generated."
    );
  }

  const csv = [
    outputColumns.join(","),
    ...cleanedRows.map((row) =>
      outputColumns
        .map((column) => escapeCSV(row[column]))
        .join(",")
    ),
  ].join("\n");

  const outputPath = path.resolve(OUTPUT_FILE);

  fs.mkdirSync(path.dirname(outputPath), {
    recursive: true,
  });

  fs.writeFileSync(outputPath, "\uFEFF" + csv, "utf8");

  const uniqueStudents = new Set(
    cleanedRows
      .map((row) => row.college_roll_number)
      .filter(Boolean)
  ).size;

  const uniqueCourses = new Set(
    cleanedRows.map((row) => row.course_name)
  ).size;

  console.log("\nProcessing completed!");
  console.log("----------------------");
  console.log(`Released rows: ${releasedRows.length}`);
  console.log(`Final records: ${cleanedRows.length}`);
  console.log(`Unique students: ${uniqueStudents}`);
  console.log(`Active courses: ${uniqueCourses}`);
  console.log(`Output: ${outputPath}`);
}

try {
  processResults();
} catch (error) {
  console.error("\nProcessing failed:", error.message);
  process.exitCode = 1;
}
