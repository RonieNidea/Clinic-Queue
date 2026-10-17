import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import './StaffRecords.css';

const DEPARTMENTS = [
  'General Medicine',
  'Nursing Assistance',
  'Basic First Aid',
  'Health Assessment',
];

function clinicToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function dateLabel(date) {
  if (!date) return 'Date unavailable';
  const parsed = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? 'Date unavailable'
    : parsed.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
}

function StaffRecords({ openPage }) {
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [records, setRecords] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [studentSearched, setStudentSearched] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    date_from: '',
    date_to: '',
    service: '',
    status: '',
  });
  const [visitForm, setVisitForm] = useState({
    visit_date: clinicToday(),
    service: DEPARTMENTS[0],
    status: 'completed',
    summary: '',
    health_notes: '',
    care_provided: '',
  });
  const [blockForm, setBlockForm] = useState({
    start_date: clinicToday(),
    end_date: clinicToday(),
    start_time: '',
    end_time: '',
    department: '',
    reason: '',
  });
  const [loading, setLoading] = useState(true);
  const [savingVisit, setSavingVisit] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [printingVisit, setPrintingVisit] = useState(null);

  async function loadRecords(nextFilters = filters, showLoading = false) {
    const query = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });

    if (showLoading) setLoading(true);
    try {
      const data = await apiRequest(`/staff/visits?${query.toString()}`);
      setRecords(Array.isArray(data.visits) ? data.visits : []);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load visit records.');
    } finally {
      setLoading(false);
    }
  }

  async function loadBlocks() {
    try {
      const data = await apiRequest('/staff/slot-blocks');
      setBlocks(Array.isArray(data.blocks) ? data.blocks : []);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load blocked slots.');
    }
  }

  useEffect(() => {
    let active = true;

    apiRequest('/staff/visits')
      .then((data) => {
        if (active) setRecords(Array.isArray(data.visits) ? data.visits : []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Unable to load visit records.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    apiRequest('/staff/slot-blocks')
      .then((data) => {
        if (active) setBlocks(Array.isArray(data.blocks) ? data.blocks : []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Unable to load blocked slots.');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!printingVisit) return undefined;

    document.body.classList.add('printing-visit-slip');
    const timer = window.setTimeout(() => window.print(), 100);
    const finishPrinting = () => setPrintingVisit(null);
    window.addEventListener('afterprint', finishPrinting);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', finishPrinting);
      document.body.classList.remove('printing-visit-slip');
    };
  }, [printingVisit]);

  async function searchStudents(event) {
    event.preventDefault();
    setError('');

    try {
      const query = new URLSearchParams();
      if (studentSearch.trim()) query.set('search', studentSearch.trim());
      const data = await apiRequest(`/staff/students?${query.toString()}`);
      setStudents(Array.isArray(data.students) ? data.students : []);
      setStudentSearched(true);
    } catch (requestError) {
      setError(requestError.message || 'Unable to search for students.');
    }
  }

  async function openStudentHistory(student) {
    setSelectedStudent(student);
    setHistory([]);
    setError('');
    setLoadingHistory(true);

    try {
      const data = await apiRequest(`/staff/students/${student.id}/visits`);
      setHistory(Array.isArray(data.visits) ? data.visits : []);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load this student’s history.');
    } finally {
      setLoadingHistory(false);
    }
  }

  async function recordVisit(event) {
    event.preventDefault();
    if (!selectedStudent) return;

    setError('');
    setMessage('');
    setSavingVisit(true);

    try {
      const data = await apiRequest('/staff/visits', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedStudent.id,
          ...visitForm,
        }),
      });
      setMessage(data.message || 'Visit recorded successfully.');
      setVisitForm((current) => ({
        ...current,
        summary: '',
        health_notes: '',
        care_provided: '',
      }));
      await Promise.all([
        openStudentHistory(selectedStudent),
        loadRecords(),
      ]);
    } catch (requestError) {
      setError(requestError.message || 'Unable to record this visit.');
    } finally {
      setSavingVisit(false);
    }
  }

  async function createSlotBlock(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSavingBlock(true);

    try {
      const data = await apiRequest('/staff/slot-blocks', {
        method: 'POST',
        body: JSON.stringify({
          ...blockForm,
          start_time: blockForm.start_time || null,
          end_time: blockForm.end_time || null,
          department: blockForm.department || null,
        }),
      });
      setMessage(data.message || 'Appointment slots blocked.');
      setBlockForm((current) => ({ ...current, reason: '' }));
      await loadBlocks();
    } catch (requestError) {
      setError(requestError.message || 'Unable to block appointment slots.');
    } finally {
      setSavingBlock(false);
    }
  }

  async function removeSlotBlock(blockId) {
    if (!window.confirm('Remove this appointment slot block?')) return;

    setError('');
    setMessage('');
    try {
      const data = await apiRequest(`/staff/slot-blocks/${blockId}`, {
        method: 'DELETE',
      });
      setMessage(data.message || 'Slot block removed.');
      await loadBlocks();
    } catch (requestError) {
      setError(requestError.message || 'Unable to remove this slot block.');
    }
  }

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function updateVisitForm(event) {
    const { name, value } = event.target;
    setVisitForm((current) => ({ ...current, [name]: value }));
  }

  function updateBlockForm(event) {
    const { name, value } = event.target;
    setBlockForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <main className="staff-records-page">
      <div className="staff-records-content">
        <header className="staff-page-header">
          <div>
            <p className="staff-eyebrow">CLINIC STAFF</p>
            <h1>Visit records</h1>
            <p>Find student records, document care, and manage appointment availability.</p>
          </div>
          <button type="button" className="staff-back-button" onClick={() => openPage('dashboard')}>
            Patient dashboard
          </button>
        </header>

        {message && <div className="staff-alert staff-success" role="status">{message}</div>}
        {error && <div className="staff-alert staff-error" role="alert">{error}</div>}

        <section className="staff-panel">
          <div className="staff-section-heading">
            <div>
              <span className="staff-eyebrow">STUDENT RECORDS</span>
              <h2>Search by student name or number</h2>
            </div>
          </div>
          <form className="staff-search-form" onSubmit={searchStudents}>
            <label htmlFor="student-search">Student name or account number</label>
            <div className="staff-search-row">
              <input
                id="student-search"
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Enter a name or student number"
              />
              <button type="submit" className="staff-primary-button">Search students</button>
            </div>
          </form>
          {students.length > 0 && (
            <div className="staff-student-results" aria-label="Student search results">
              {students.map((student) => (
                <button
                  type="button"
                  className={selectedStudent?.id === student.id ? 'staff-student-result selected' : 'staff-student-result'}
                  key={student.id}
                  onClick={() => openStudentHistory(student)}
                >
                  <span>{student.name}</span>
                  <small>Student #{student.student_number || student.id} · View visit history</small>
                </button>
              ))}
            </div>
          )}
          {studentSearched && students.length === 0 && (
            <p className="staff-empty-state">No students match that search.</p>
          )}
        </section>

        {selectedStudent && (
          <section className="staff-panel">
            <div className="staff-section-heading">
              <div>
                <span className="staff-eyebrow">STUDENT #{selectedStudent.id}</span>
                <h2>{selectedStudent.name} — visit history</h2>
              </div>
            </div>

            <form className="staff-visit-form" onSubmit={recordVisit}>
              <h3>Record a visit and care provided</h3>
              <div className="staff-form-grid">
                <label>
                  Visit date
                  <input type="date" name="visit_date" value={visitForm.visit_date} onChange={updateVisitForm} required />
                </label>
                <label>
                  Service
                  <select name="service" value={visitForm.service} onChange={updateVisitForm} required>
                    {DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}
                  </select>
                </label>
                <label>
                  Status
                  <select name="status" value={visitForm.status} onChange={updateVisitForm} required>
                    <option value="completed">Completed</option>
                    <option value="follow_up">Follow-up needed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
                <label className="staff-form-wide">
                  Visit summary
                  <textarea name="summary" rows={3} maxLength={5000} value={visitForm.summary} onChange={updateVisitForm} required />
                </label>
                <label className="staff-form-wide">
                  Care provided
                  <textarea name="care_provided" rows={3} maxLength={5000} value={visitForm.care_provided} onChange={updateVisitForm} />
                </label>
                <label className="staff-form-wide">
                  Private health notes
                  <textarea name="health_notes" rows={3} maxLength={10000} value={visitForm.health_notes} onChange={updateVisitForm} />
                  <small>Visible only to this student and authorized clinic staff.</small>
                </label>
              </div>
              <button type="submit" className="staff-primary-button" disabled={savingVisit}>
                {savingVisit ? 'Saving visit...' : 'Save visit record'}
              </button>
            </form>

            <div className="staff-history-list">
              {loadingHistory ? (
                <p className="staff-empty-state">Loading this student’s visit history...</p>
              ) : history.length === 0 ? (
                <p className="staff-empty-state">No past visits have been recorded for this student.</p>
              ) : history.map((visit) => (
                <article className="staff-visit-card" key={visit.id}>
                  <div className="staff-visit-card-heading">
                    <div>
                      <span>{dateLabel(visit.visit_date)} · Visit #{visit.id}</span>
                      <h3>{visit.service}</h3>
                    </div>
                    <button type="button" className="staff-secondary-button" onClick={() => setPrintingVisit({ ...visit, student: selectedStudent })}>
                      Print visit slip
                    </button>
                  </div>
                  <p><strong>Status:</strong> {visit.status.replace('_', ' ')}</p>
                  <p><strong>Summary:</strong> {visit.summary}</p>
                  {visit.care_provided && <p><strong>Care provided:</strong> {visit.care_provided}</p>}
                  {visit.health_notes && <p className="staff-private-notes"><strong>Private health notes:</strong> {visit.health_notes}</p>}
                  {visit.rating && <p><strong>Student rating:</strong> {visit.rating}/5{visit.feedback ? ` — ${visit.feedback}` : ''}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="staff-panel">
          <div className="staff-section-heading">
            <div>
              <span className="staff-eyebrow">RECORDS TABLE</span>
              <h2>Search and filter visits</h2>
            </div>
          </div>
          <form
            className="staff-filter-form"
            onSubmit={(event) => {
              event.preventDefault();
              loadRecords(filters, true);
            }}
          >
            <label>
              Student name or number
              <input name="search" value={filters.search} onChange={updateFilter} />
            </label>
            <label>
              From date
              <input type="date" name="date_from" value={filters.date_from} onChange={updateFilter} />
            </label>
            <label>
              To date
              <input type="date" name="date_to" value={filters.date_to} onChange={updateFilter} />
            </label>
            <label>
              Service
              <select name="service" value={filters.service} onChange={updateFilter}>
                <option value="">All services</option>
                {DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}
              </select>
            </label>
            <label>
              Status
              <select name="status" value={filters.status} onChange={updateFilter}>
                <option value="">All statuses</option>
                <option value="completed">Completed</option>
                <option value="follow_up">Follow-up needed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <div className="staff-filter-actions">
              <button type="submit" className="staff-primary-button" disabled={loading}>
                {loading ? 'Searching...' : 'Apply filters'}
              </button>
              <button
                type="button"
                className="staff-secondary-button"
                onClick={() => {
                  const emptyFilters = { search: '', date_from: '', date_to: '', service: '', status: '' };
                  setFilters(emptyFilters);
                  loadRecords(emptyFilters, true);
                }}
              >
                Clear
              </button>
            </div>
          </form>
          <div className="staff-table-wrap">
            <table className="staff-records-table">
              <thead>
                <tr><th>Date</th><th>Student</th><th>Service</th><th>Status</th><th>History</th></tr>
              </thead>
              <tbody>
                {records.map((visit) => (
                  <tr key={visit.id}>
                    <td>{dateLabel(visit.visit_date)}</td>
                    <td>#{visit.user.student_number || visit.user.id} · {visit.user.name}</td>
                    <td>{visit.service}</td>
                    <td>{visit.status.replace('_', ' ')}</td>
                    <td>
                      <button type="button" className="staff-table-link" onClick={() => openStudentHistory(visit.user)}>
                        Open history
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && records.length === 0 && (
                  <tr><td colSpan="5">No visit records match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="staff-table-note">Showing up to 100 matching visit records.</p>
        </section>

        <section className="staff-panel">
          <div className="staff-section-heading">
            <div>
              <span className="staff-eyebrow">APPOINTMENT AVAILABILITY</span>
              <h2>Block slots for lunch, holidays, or events</h2>
              <p>Leave both time fields empty to block the full day or date range.</p>
            </div>
          </div>
          <form className="staff-filter-form staff-block-form" onSubmit={createSlotBlock}>
            <label>
              Start date
              <input type="date" name="start_date" value={blockForm.start_date} onChange={updateBlockForm} required />
            </label>
            <label>
              End date
              <input type="date" name="end_date" min={blockForm.start_date} value={blockForm.end_date} onChange={updateBlockForm} required />
            </label>
            <label>
              Start time (optional)
              <input type="time" name="start_time" value={blockForm.start_time} onChange={updateBlockForm} />
            </label>
            <label>
              End time (optional)
              <input type="time" name="end_time" value={blockForm.end_time} onChange={updateBlockForm} />
            </label>
            <label>
              Service
              <select name="department" value={blockForm.department} onChange={updateBlockForm}>
                <option value="">All services</option>
                {DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}
              </select>
            </label>
            <label>
              Reason
              <input name="reason" maxLength={180} value={blockForm.reason} onChange={updateBlockForm} placeholder="Lunch, holiday, event..." required />
            </label>
            <div className="staff-filter-actions">
              <button type="submit" className="staff-primary-button" disabled={savingBlock}>
                {savingBlock ? 'Saving...' : 'Block appointment slots'}
              </button>
            </div>
          </form>
          <div className="staff-block-list">
            {blocks.length === 0 ? (
              <p className="staff-empty-state">There are no future or past slot blocks recorded.</p>
            ) : blocks.map((block) => (
              <article className="staff-block-item" key={block.id}>
                <div>
                  <strong>{block.reason}</strong>
                  <span>{dateLabel(block.start_date)} – {dateLabel(block.end_date)}</span>
                  <small>
                    {block.start_time && block.end_time
                      ? `${String(block.start_time).slice(0, 5)}–${String(block.end_time).slice(0, 5)}`
                      : 'All day'}
                    {' · '}{block.department || 'All services'}
                  </small>
                </div>
                <button type="button" className="staff-secondary-button" onClick={() => removeSlotBlock(block.id)}>
                  Remove block
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>

      {printingVisit && (
        <article className="staff-print-slip">
          <p className="staff-eyebrow">ST PETER'S COLLEGE · CLINIC</p>
          <h1>Visit Slip</h1>
          <p><strong>Student:</strong> {printingVisit.student.name}</p>
          <p><strong>Student number:</strong> {printingVisit.student.student_number || printingVisit.student.id}</p>
          <p><strong>Visit reference:</strong> #{printingVisit.id}</p>
          <p><strong>Date:</strong> {dateLabel(printingVisit.visit_date)}</p>
          <p><strong>Service:</strong> {printingVisit.service}</p>
          <p><strong>Status:</strong> {printingVisit.status.replace('_', ' ')}</p>
          <p><strong>Visit summary:</strong> {printingVisit.summary}</p>
          {printingVisit.care_provided && <p><strong>Care provided:</strong> {printingVisit.care_provided}</p>}
          <p className="staff-print-note">This slip does not include private clinic health notes.</p>
        </article>
      )}
    </main>
  );
}

export default StaffRecords;
