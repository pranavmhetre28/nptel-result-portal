
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  GraduationCap,
  BookOpen,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";

import { loadResults } from "./utils/loadResults";
import Analytics from "./pages/Analytics";
import Leaderboard from "./pages/Leaderboard";
import "./App.css";

function App() {
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("home");

  useEffect(() => {
    loadResults()
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load results. Please check the CSV file.");
        setLoading(false);
      });
  }, []);

  const uniqueStudents = useMemo(() => {
    return new Set(
      results.map((student) => student.college_roll_number).filter(Boolean)
    ).size;
  }, [results]);

  // Search students by name or college roll number
  
  // Search students by name (any word order) or college roll number
  const filteredResults = useMemo(() => {
      const normalize = (value) =>
        String(value || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();

      const query = normalize(search);

      if (query.length < 2) return [];

      const queryWords = query.split(/\s+/).filter(Boolean);

      return results.filter((student) => {
        const name = normalize(student.name);
        const roll = normalize(student.college_roll_number);

        const matchesName = queryWords.every((word) =>
          name.includes(word)
        );

        const matchesRoll = roll.includes(query);

        return matchesName || matchesRoll;
      });
    }, [results, search]);


  // Group all course records belonging to the same student
  const groupedStudents = useMemo(() => {
    const groups = new Map();

    filteredResults.forEach((student, index) => {
      const roll = String(student.college_roll_number || "").trim();
      const key = roll || `unknown-${student.name}-${index}`;

      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          name: student.name || "Unknown Student",
          rollNumber: roll || "N/A",
          studyYear: student.study_year || "N/A",
          courses: [],
        });
      }

      groups.get(key).courses.push(student);
    });

    return Array.from(groups.values());
  }, [filteredResults]);

  // Calculate performance for one student
  const getStudentStats = (courses) => {
    const passCount = courses.filter(
      (course) =>
        String(course.pass_status || "").trim().toLowerCase() === "pass"
    ).length;

    const failCount = courses.filter(
      (course) =>
        String(course.pass_status || "").trim().toLowerCase() === "fail"
    ).length;

    const validMarks = courses
      .map((course) => Number(course.total_marks_100))
      .filter(Number.isFinite);

    const average =
      validMarks.length > 0
        ? validMarks.reduce((sum, marks) => sum + marks, 0) /
          validMarks.length
        : 0;

    return {
      totalCourses: courses.length,
      passCount,
      failCount,
      average,
    };
  };

  const getStatusClass = (status) => {
    const value = String(status || "").trim().toLowerCase();

    if (value === "pass") return "pass";
    if (value === "fail") return "fail";

    return "other";
  };

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <GraduationCap size={30} />
          <span>NPTEL Results</span>
        </div>

        <nav className="nav-links">
          <button
            className={activePage === "home" ? "active" : ""}
            onClick={() => setActivePage("home")}
          >
            Home
          </button>

          <button
            className={activePage === "analytics" ? "active" : ""}
            onClick={() => setActivePage("analytics")}
          >
            Analytics
          </button>

          <button
            className={activePage === "leaderboard" ? "active" : ""}
            onClick={() => setActivePage("leaderboard")}
          >
            Leaderboard
          </button>
        </nav>

        <span className="year-badge">2026</span>
      </header>

      <main className="container">
        {activePage === "home" && (
          <>
            <section className="hero">
              <span className="eyebrow">STUDENT RESULT PORTAL</span>
              <h1>Find Your NPTEL Results</h1>
              <p>
                Search using your name or college roll number
                to view your course-wise results.
              </p>

              <div className="search-box">
                <Search size={22} />
                <input
                  type="text"
                  placeholder="Enter your name or roll number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {search && (
                  <button onClick={() => setSearch("")}>Clear</button>
                )}
              </div>

              <small>Enter at least 2 characters to search.</small>
            </section>

            <section className="stats">
              <div className="stat-card">
                <Users />
                <div>
                  <h2>{loading ? "..." : uniqueStudents}</h2>
                  <p>Students</p>
                </div>
              </div>

              <div className="stat-card">
                <BookOpen />
                <div>
                  <h2>{loading ? "..." : results.length}</h2>
                  <p>Result Records</p>
                </div>
              </div>
            </section>

            <section className="results-section">
              <h2>Student Results</h2>

              {loading && <p className="message">Loading results...</p>}
              {error && <p className="error">{error}</p>}

              {!loading && !error && search.trim().length < 2 && (
                <div className="empty-state">
                  <Search size={36} />
                  <h3>Search for a student</h3>
                  <p>Enter a name or roll number to find results.</p>
                </div>
              )}

              {!loading &&
                search.trim().length >= 2 &&
                groupedStudents.length === 0 && (
                  <div className="empty-state">
                    <h3>No results found</h3>
                    <p>Try another name or roll number.</p>
                  </div>
                )}

              <div className="student-results">
                {groupedStudents.map((student) => {
                  const stats = getStudentStats(student.courses);

                  return (
                    <article className="student-profile" key={student.id}>
                      {/* Student Profile */}
                      <div className="profile-header">
                        <div className="profile-identity">
                          <div className="profile-avatar">
                            {student.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <h3>{student.name}</h3>
                            <p>
                              College Roll No: <strong>{student.rollNumber}</strong>
                            </p>
                            <p>
                              Study Year: <strong>{student.studyYear}</strong>
                            </p>
                          </div>
                        </div>

                        <span className="profile-tag">
                          <GraduationCap size={16} />
                          NPTEL 2026
                        </span>
                      </div>

                      {/* Performance Summary */}
                      <div className="performance-summary">
                        <div className="performance-item">
                          <BookOpen />
                          <div>
                            <span>Total Courses</span>
                            <strong>{stats.totalCourses}</strong>
                          </div>
                        </div>

                        <div className="performance-item">
                          <CheckCircle2 className="pass-icon" />
                          <div>
                            <span>Passed</span>
                            <strong>{stats.passCount}</strong>
                          </div>
                        </div>

                        <div className="performance-item">
                          <XCircle className="fail-icon" />
                          <div>
                            <span>Failed</span>
                            <strong>{stats.failCount}</strong>
                          </div>
                        </div>

                        <div className="performance-item">
                          <TrendingUp />
                          <div>
                            <span>Average Marks</span>
                            <strong>{stats.average.toFixed(2)}/100</strong>
                          </div>
                        </div>
                      </div>

                      {/* Course Results */}
                      <div className="course-results">
                        <h4>Course-wise Results</h4>

                        <div className="table-wrapper">
                          <table className="student-result-table">
                            <thead>
                              <tr>
                                <th>Course</th>
                                <th>Assignment</th>
                                <th>Exam</th>
                                <th>Total</th>
                                <th>Performance</th>
                                <th>Status</th>
                              </tr>
                            </thead>

                            <tbody>
                              {student.courses.map((course, index) => {
                                const marks = Number(course.total_marks_100);
                                const validMarks = Number.isFinite(marks);
                                const progress = validMarks
                                  ? Math.max(0, Math.min(100, marks))
                                  : 0;

                                return (
                                  <tr
                                    key={`${course.course_code}-${index}`}
                                  >
                                    <td>
                                      <strong>{course.course_name}</strong>
                                      <small>{course.course_code}</small>
                                    </td>

                                    <td>
                                      {course.assignment_marks_25 ?? "N/A"}/25
                                    </td>

                                    <td>
                                      {course.exam_marks_75 ?? "N/A"}/75
                                    </td>

                                    <td>
                                      <strong>
                                        {course.total_marks_100 ?? "N/A"}/100
                                      </strong>
                                    </td>

                                    <td>
                                      <div className="marks-progress">
                                        <div
                                          className="marks-progress-fill"
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                      <small>
                                        {validMarks
                                          ? `${progress.toFixed(1)}%`
                                          : "N/A"}
                                      </small>
                                    </td>

                                    <td>
                                      <span
                                        className={`status-badge ${getStatusClass(
                                          course.pass_status
                                        )}`}
                                      >
                                        {course.pass_status || "N/A"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="profile-footer">
                        <span>
                          Semester: {student.courses[0]?.semester || "N/A"}
                        </span>
                        <span>
                          Academic Year:{" "}
                          {student.courses[0]?.academic_year || "N/A"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>

              {!loading && groupedStudents.length > 0 && (
                <p className="result-count">
                  Found {filteredResults.length} course result(s) for{" "}
                  {groupedStudents.length} student(s).
                </p>
              )}
            </section>
          </>
        )}

        {activePage === "analytics" && <Analytics results={results} />}

        {activePage === "leaderboard" && <Leaderboard results={results} />}
      </main>

      <footer>
        <p>NPTEL Results Portal · Academic Year 2026</p>
      </footer>
    </div>
  );
}

export default App;
