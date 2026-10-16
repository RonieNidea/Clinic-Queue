import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import './PatientVisits.css';

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

function PatientVisits() {
  const [visits, setVisits] = useState([]);
  const [ratings, setRatings] = useState({});
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    apiRequest('/visits')
      .then((data) => {
        if (active) {
          setVisits(Array.isArray(data.visits) ? data.visits : []);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Unable to load your visit summaries.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function submitRating(visitId) {
    setMessage('');
    setError('');
    setSaving(visitId);

    try {
      const data = await apiRequest(`/visits/${visitId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({
          rating: Number(ratings[visitId]),
          feedback: feedback[visitId] || '',
        }),
      });

      setVisits((current) =>
        current.map((visit) =>
          visit.id === visitId ? data.visit : visit
        )
      );
      setMessage('Thanks for sharing your feedback.');
    } catch (err) {
      setError(err.message || 'Unable to submit your rating.');
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="cq-panel cq-visits-panel">
      <div className="cq-panel-heading">
        <div>
          <p className="cq-eyebrow">YOUR HEALTH RECORDS</p>
          <h2>Past visit summaries</h2>
          <p className="cq-panel-description">
            Review summaries and notes recorded by clinic staff.
          </p>
        </div>
      </div>

      {message && <p className="cq-visit-message" role="status">{message}</p>}
      {error && <p className="cq-visit-error" role="alert">{error}</p>}

      {loading ? (
        <p className="cq-table-message">Loading your visit history...</p>
      ) : visits.length === 0 ? (
        <div className="cq-empty-history">
          Your clinic visit summaries will appear here after staff records a visit.
        </div>
      ) : (
        <div className="cq-visit-list">
          {visits.map((visit) => (
            <article className="cq-visit-card" key={visit.id}>
              <div className="cq-visit-heading">
                <div>
                  <span className="cq-visit-date">{dateLabel(visit.visit_date)}</span>
                  <h3>{visit.service}</h3>
                </div>
                <span className={`cq-status cq-status-${visit.status}`}>
                  {visit.status.replace('_', ' ')}
                </span>
              </div>

              <p className="cq-visit-summary">{visit.summary}</p>
              {visit.care_provided && (
                <p><strong>Care provided:</strong> {visit.care_provided}</p>
              )}
              {visit.health_notes && (
                <details className="cq-health-notes">
                  <summary>Clinic health notes</summary>
                  <p>{visit.health_notes}</p>
                </details>
              )}

              {visit.rating ? (
                <p className="cq-visit-rating" aria-label={`Your rating: ${visit.rating} out of 5`}>
                  Your rating: {'★'.repeat(visit.rating)}{'☆'.repeat(5 - visit.rating)}
                  {visit.feedback && <span> · {visit.feedback}</span>}
                </p>
              ) : visit.status === 'completed' ? (
                <div className="cq-review-form">
                  <label>
                    Rate your visit
                    <select
                      value={ratings[visit.id] || ''}
                      onChange={(event) =>
                        setRatings((current) => ({
                          ...current,
                          [visit.id]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Choose a rating</option>
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Okay</option>
                      <option value="2">2 - Poor</option>
                      <option value="1">1 - Very poor</option>
                    </select>
                  </label>
                  <label>
                    Optional feedback
                    <textarea
                      rows={2}
                      maxLength={1000}
                      value={feedback[visit.id] || ''}
                      onChange={(event) =>
                        setFeedback((current) => ({
                          ...current,
                          [visit.id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="cq-submit-button"
                    disabled={!ratings[visit.id] || saving === visit.id}
                    onClick={() => submitRating(visit.id)}
                  >
                    {saving === visit.id ? 'Submitting...' : 'Submit rating'}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default PatientVisits;
