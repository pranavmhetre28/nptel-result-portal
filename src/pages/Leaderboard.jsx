
import { useMemo, useState } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import "./Leaderboard.css";

function Leaderboard({ results }) {
  const [activeTab, setActiveTab] = useState("overall");
  const [selectedCourse, setSelectedCourse] = useState("");

  const courses = useMemo(() => {
    return [...new Set(results.map(r => r.course_name).filter(Boolean))]
      .sort();
  }, [results]);

  // Overall leaderboard: highest single-course marks per student
  const overallRanking = useMemo(() => {
    const studentMap = new Map();

    results.forEach(student => {
      const marks = student.total_marks_100;

      if (
        !student.college_roll_number ||
        !Number.isFinite(marks)
      ) return;

      const roll = student.college_roll_number;

      if (
        !studentMap.has(roll) ||
        marks > studentMap.get(roll).marks
      ) {
        studentMap.set(roll, {
          name: student.name,
          roll,
          marks,
          course: student.course_name,
        });
      }
    });

    return [...studentMap.values()]
      .sort((a, b) => b.marks - a.marks)
      .slice(0, 10)
      .map((student, index, array) => ({
        ...student,
        rank: index === 0 || student.marks !== array[index - 1].marks
          ? index + 1
          : array[index - 1].rank,
      }));
  }, [results]);

  // Subject-wise leaderboard
  const subjectRanking = useMemo(() => {
    if (!selectedCourse) return [];

    const students = results
      .filter(
        r =>
          r.course_name === selectedCourse &&
          r.college_roll_number &&
          Number.isFinite(r.total_marks_100)
      )
      .sort((a, b) => b.total_marks_100 - a.total_marks_100);

    const uniqueStudents = new Map();

    students.forEach(student => {
      const roll = student.college_roll_number;

      if (
        !uniqueStudents.has(roll) ||
        student.total_marks_100 > uniqueStudents.get(roll).marks
      ) {
        uniqueStudents.set(roll, {
          name: student.name,
          roll,
          marks: student.total_marks_100,
          course: student.course_name,
        });
      }
    });

    const ranking = [...uniqueStudents.values()]
      .sort((a, b) => b.marks - a.marks)
      .slice(0, 10);

    return ranking.map((student, index, array) => ({
      ...student,
      rank: index === 0 || student.marks !== array[index - 1].marks
        ? index + 1
        : array[index - 1].rank,
    }));
  }, [results, selectedCourse]);

  const getRankIcon = rank => {
    if (rank === 1) return <Trophy className="gold-icon" />;
    if (rank === 2) return <Medal className="silver-icon" />;
    if (rank === 3) return <Award className="bronze-icon" />;
    return <span className="rank-number">{rank}</span>;
  };

  const ranking = activeTab === "overall"
    ? overallRanking
    : subjectRanking;

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-heading">
        <span className="leaderboard-label">NPTEL 2026</span>
        <h1>Leaderboard</h1>
        <p>Celebrate the highest-performing students.</p>
      </div>

      <div className="leaderboard-tabs">
        <button
          className={activeTab === "overall" ? "selected" : ""}
          onClick={() => setActiveTab("overall")}
        >
          <Trophy size={17} />
          Overall Top 10
        </button>

        <button
          className={activeTab === "subject" ? "selected" : ""}
          onClick={() => setActiveTab("subject")}
        >
          <Medal size={17} />
          Subject-wise Top 10
        </button>
      </div>

      {activeTab === "subject" && (
        <div className="course-selector">
          <label htmlFor="course">Select Subject</label>
          <select
            id="course"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
          >
            <option value="">Choose a course</option>
            {courses.map(course => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="leaderboard-card">
        <div className="leaderboard-card-heading">
          <div>
            <h2>
              {activeTab === "overall"
                ? "Overall Top 10"
                : "Subject Top 10"}
            </h2>
            <p>
              {activeTab === "overall"
                ? "Ranked by highest marks in a single course"
                : selectedCourse || "Select a subject to view rankings"}
            </p>
          </div>
          <Trophy size={26} color="#D69E36" />
        </div>

        {activeTab === "subject" && !selectedCourse ? (
          <div className="leaderboard-empty">
            Select a subject to see its top performers.
          </div>
        ) : ranking.length === 0 ? (
          <div className="leaderboard-empty">
            No ranking data available.
          </div>
        ) : (
          <div className="ranking-list">
            {ranking.map((student, index) => (
              <div
                className="ranking-row"
                key={student.roll}
              >
                <div className="ranking-position">
                  {getRankIcon(student.rank)}
                </div>

                <div className="ranking-avatar">
                  {student.name?.charAt(0).toUpperCase()}
                </div>

                <div className="ranking-student">
                  <h3>{student.name}</h3>
                  <p>{student.roll}</p>
                  {activeTab === "overall" && (
                    <span>{student.course}</span>
                  )}
                </div>

                <div className="ranking-marks">
                  <strong>{student.marks}</strong>
                  <span>/ 100</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
