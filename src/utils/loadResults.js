
import Papa from "papaparse";

const toNumber = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const loadResults = () => {
  return new Promise((resolve, reject) => {
    Papa.parse("/data/results.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,

      complete: (result) => {
        if (result.errors.length > 0) {
          console.warn("CSV parsing warnings:", result.errors);
        }

        const cleanedData = result.data.map((row) => ({
          ...row,
          name: row.name?.trim() || "",
          college_roll_number: row.college_roll_number?.trim() || "",
          course_name: row.course_name?.trim() || "",
          study_year: toNumber(row.study_year),
          academic_year: toNumber(row.academic_year),
          assignment_marks_25: toNumber(row.assignment_marks_25),
          exam_marks_75: toNumber(row.exam_marks_75),
          total_marks_100: toNumber(row.total_marks_100),
        }));

        // Keep only students from study years 1 to 4.
        const validYearData = cleanedData.filter(
          (row) =>
            Number.isInteger(row.study_year) &&
            row.study_year >= 1 &&
            row.study_year <= 4
        );

        // Identify courses where at least one student has an exam mark.
        // Zero is a valid exam mark; null means no recorded exam mark.
        const coursesWithExamParticipation = new Set(
          validYearData
            .filter((row) => row.exam_marks_75 !== null)
            .map((row) => row.course_name)
            .filter(Boolean)
        );

        // Retain all records belonging to courses with exam participation.
        const finalData = validYearData.filter((row) =>
          coursesWithExamParticipation.has(row.course_name)
        );

        resolve(finalData);
      },

      error: (error) => reject(error),
    });
  });
};
