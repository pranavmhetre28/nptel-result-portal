
import { useMemo, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import "./Analytics.css";

function Analytics({ results }) {
  const [studyYear, setStudyYear] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [semester, setSemester] = useState("All");
  const [resultStatus, setResultStatus] = useState("All");

  // Get unique filter options from the complete dataset
  const studyYears = useMemo(
    () =>
      [...new Set(results.map((r) => String(r.study_year || "").trim()).filter(Boolean))]
        .sort(),
    [results]
  );

  const courses = useMemo(
    () =>
      [...new Set(results.map((r) => r.course_name).filter(Boolean))].sort(),
    [results]
  );

  const semesters = useMemo(
    () =>
      [...new Set(results.map((r) => r.semester).filter(Boolean))].sort(),
    [results]
  );

  // Apply filters
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const matchesYear =
        studyYear === "All" ||
        String(r.study_year || "").trim() === studyYear;

      const matchesCourse =
        selectedCourse === "All" ||
        r.course_name === selectedCourse;

      const matchesSemester =
        semester === "All" ||
        r.semester === semester;

      const status = String(r.pass_status || "").trim().toLowerCase();

      const matchesStatus =
        resultStatus === "All" ||
        status === resultStatus.toLowerCase();

      return (
        matchesYear &&
        matchesCourse &&
        matchesSemester &&
        matchesStatus
      );
    });
  }, [results, studyYear, selectedCourse, semester, resultStatus]);

  // Calculate dashboard statistics
  const analytics = useMemo(() => {
    const validMarks = filteredResults
      .map((r) => Number(r.total_marks_100))
      .filter(Number.isFinite);

    const averageMarks =
      validMarks.length > 0
        ? validMarks.reduce((sum, marks) => sum + marks, 0) /
          validMarks.length
        : 0;

    const students = new Set(
      filteredResults
        .map((r) => r.college_roll_number)
        .filter(Boolean)
    );

    const passCount = filteredResults.filter(
      (r) => String(r.pass_status).trim().toLowerCase() === "pass"
    ).length;

    const failCount = filteredResults.filter(
      (r) => String(r.pass_status).trim().toLowerCase() === "fail"
    ).length;

    const evaluatedCount = passCount + failCount;

    const passPercentage =
      evaluatedCount > 0
        ? (passCount / evaluatedCount) * 100
        : 0;

    const courseMap = {};

    filteredResults.forEach((r) => {
      const course = r.course_name;
      const marks = Number(r.total_marks_100);

      if (!course || !Number.isFinite(marks)) return;

      if (!courseMap[course]) {
        courseMap[course] = { total: 0, count: 0 };
      }

      courseMap[course].total += marks;
      courseMap[course].count += 1;
    });

    const courseAverages = Object.entries(courseMap)
      .map(([course, data]) => ({
        course:
          course.length > 24
            ? course.substring(0, 24) + "..."
            : course,
        average: Number((data.total / data.count).toFixed(2)),
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 8);

    
    // Count unique students in each course
    const courseStudentMap = {};

    filteredResults.forEach((r) => {
      const course = r.course_name;
      const roll = String(r.college_roll_number || "").trim();

      if (!course || !roll) return;

      if (!courseStudentMap[course]) {
        courseStudentMap[course] = new Set();
      }

      courseStudentMap[course].add(roll);
    });

    const courseStudentCounts = Object.entries(courseStudentMap)
      .map(([course, students]) => ({
        course:
          course.length > 24
            ? course.substring(0, 24) + "..."
            : course,
        studentCount: students.size,
      }))
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 5);

    const passData = [
      { name: "Pass", value: passCount },
      { name: "Fail", value: failCount },
    ].filter((item) => item.value > 0);

    return {
      totalStudents: students.size,
      totalRecords: filteredResults.length,
      averageMarks,
      passPercentage,
      passCount,
      failCount,
      evaluatedCount,
      totalCourses: new Set(
        filteredResults.map((r) => r.course_name).filter(Boolean)
      ).size,
      courseAverages,
      courseStudentCounts,
      passData,
    };
  }, [filteredResults]);

  const resetFilters = () => {
    setStudyYear("All");
    setSelectedCourse("All");
    setSemester("All");
    setResultStatus("All");
  };

  return (
    <div className="analytics-page">
      <div className="analytics-heading">
        <h1>Analytics Dashboard</h1>
        <p>Explore NPTEL student performance and results.</p>
      </div>

      {/* Filters */}
      <div className="analytics-filters">
        <div className="filter-group">
          <label>Study Year</label>
          <select
            value={studyYear}
            onChange={(e) => setStudyYear(e.target.value)}
          >
            <option value="All">All Years</option>
            {studyYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="All">All Courses</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Semester</label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          >
            <option value="All">All Semesters</option>
            {semesters.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Result Status</label>
          <select
            value={resultStatus}
            onChange={(e) => setResultStatus(e.target.value)}
          >
            <option value="All">All Results</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </select>
        </div>

        <button className="reset-filter-btn" onClick={resetFilters}>
          Reset Filters
        </button>
      </div>

      <p className="filter-summary">
        Showing <strong>{filteredResults.length}</strong> result records
        out of <strong>{results.length}</strong>.
      </p>

      {/* KPI Cards */}
      <div className="analytics-stats">
        <div className="analytics-stat">
          <span className="analytics-label">Total Students</span>
          <h2>{analytics.totalStudents}</h2>
        </div>

        <div className="analytics-stat">
          <span className="analytics-label">Result Records</span>
          <h2>{analytics.totalRecords}</h2>
        </div>

        <div className="analytics-stat">
          <span className="analytics-label">Average Marks</span>
          <h2>{analytics.averageMarks.toFixed(2)}</h2>
        </div>

        <div className="analytics-stat">
          <span className="analytics-label">Pass Percentage</span>
          <h2>{analytics.passPercentage.toFixed(2)}%</h2>
        </div>

        <div className="analytics-stat">
          <span className="analytics-label">Total Courses</span>
          <h2>{analytics.totalCourses}</h2>
        </div>

        <div className="analytics-stat">
          <span className="analytics-label">Failed Records</span>
          <h2>{analytics.failCount}</h2>
        </div>
      </div>

      {/* Charts */}
      <div className="analytics-grid">
        
        <div className="chart-card">
          <h3>Course-wise Student Count</h3>

          {analytics.courseStudentCounts.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={Math.max(300, analytics.courseStudentCounts.length * 48)}
            >
              <BarChart
                data={analytics.courseStudentCounts}
                layout="vertical"
                margin={{ left: 15, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="course"
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar
                  dataKey="studentCount"
                  name="Students"
                  fill="#2563eb"
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-chart-data">
              No course participation data available.
            </p>
          )}
        </div>

        <div className="chart-card">
          <h3>Pass vs Fail Distribution</h3>

          {analytics.passData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.passData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {analytics.passData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.name === "Pass" ? "#16a34a" : "#dc2626"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-chart-data">No evaluated results available.</p>
          )}
        </div>

        <div className="chart-card">
          <h3>Top Course Average Marks</h3>

          {analytics.courseAverages.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analytics.courseAverages}
                layout="vertical"
                margin={{ left: 15, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="course"
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar
                  dataKey="average"
                  fill="#2563eb"
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-chart-data">No course data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
