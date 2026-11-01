
import { useEffect, useMemo, useState } from "react";
import { Search, GraduationCap, BookOpen, Users } from "lucide-react";
import { loadResults } from "./utils/loadResults";
import "./App.css";

function App() {
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      results
        .map((student) => student.college_roll_number)
        .filter(Boolean)
    ).size;
  }, [results]);

  const filteredResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (query.length < 2) return [];

    return results.filter((student) => {
      return (
        student.name.toLowerCase().includes(query) ||
        student.college_roll_number.toLowerCase().includes(query)
      );
    });
  }, [results, search]);

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <GraduationCap size={30} />
          <span>NPTEL Results</span>
        </div>
        <span className="year-badge">2026</span>
      </header>

      <main className="container">
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
              <button onClick={() => setSearch("")}>
                Clear
              </button>
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
            filteredResults.length === 0 && (
              <div className="empty-state">
                <h3>No results found</h3>
                <p>Try another name or roll number.</p>
              </div>
            )}

          <div className="result-list">
            {filteredResults.map((student, index) => (
              <article
                className="result-card"
                key={`${student.college_roll_number}-${student.course_code}-${index}`}
              >
                <div className="student-info">
                  <div className="avatar">
                    {student.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3>{student.name}</h3>
                    <p>Roll No: {student.college_roll_number}</p>
                    <p>Year: {student.study_year ?? "N/A"}</p>
                  </div>
                </div>

                <div className="course-info">
                  <h4>{student.course_name}</h4>
                  <p>Course Code: {student.course_code}</p>
                </div>

                <div className="marks-grid">
                  <div>
                    <span>Assignment</span>
                    <strong>
                      {student.assignment_marks_25 ?? "N/A"}/25
                    </strong>
                  </div>
                  <div>
                    <span>Exam</span>
                    <strong>
                      {student.exam_marks_75 ?? "N/A"}/75
                    </strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>
                      {student.total_marks_100 ?? "N/A"}/100
                    </strong>
                  </div>
                </div>

                <div className="result-footer">
                  <span
                    className={
                      student.pass_status?.toLowerCase() === "pass"
                        ? "status pass"
                        : "status fail"
                    }
                  >
                    {student.pass_status}
                  </span>

                  <span className="semester">
                    {student.semester} {student.academic_year}
                  </span>
                </div>
              </article>
            ))}
          </div>

          {!loading && filteredResults.length > 0 && (
            <p className="result-count">
              Found {filteredResults.length} course result(s).
            </p>
          )}
        </section>
      </main>

      <footer>
        <p>NPTEL Results Portal · Academic Year 2026</p>
      </footer>
    </div>
  );
}

export default App;
