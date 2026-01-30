import { useState, useEffect } from 'react';
import { api, MonthlySummary as MonthlySummaryType } from '../api';
import './MonthlySummary.css';

function MonthlySummary() {
  const [summary, setSummary] = useState<MonthlySummaryType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string>('A');
  
  // Initialize with current month
  const getCurrentMonth = () => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  };
  const [month, setMonth] = useState<string>(getCurrentMonth());

  const fetchSummary = async () => {
    if (!partnerId || !month) {
      setError('Please select both partner and month');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.getMonthlySummary(partnerId, month);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch summary');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSummary();
  };

  // Fetch summary on mount with default values
  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="monthly-summary">
      <div className="card">
        <h2 className="card-title">Monthly Sales Summary</h2>
        
        <form onSubmit={handleSubmit} className="summary-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="partnerId">Partner ID</label>
              <select
                id="partnerId"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                required
              >
                <option value="A">Partner A</option>
                <option value="B">Partner B</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="month">Month (MM-YYYY)</label>
              <input
                id="month"
                type="text"
                placeholder="01-2024"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                pattern="\d{2}-\d{4}"
                required
              />
            </div>
          </div>
          
          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Loading...' : 'Get Summary'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {loading && <div className="loading">Loading summary...</div>}

        {!loading && !error && summary && (
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-card-label">Total Gross</div>
              <div className="summary-card-value">${summary.totalGross.toFixed(2)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Total Discount</div>
              <div className="summary-card-value">${summary.totalDiscount.toFixed(2)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Total Net</div>
              <div className="summary-card-value">${summary.totalNet.toFixed(2)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Order Count</div>
              <div className="summary-card-value">{summary.orderCount}</div>
            </div>
          </div>
        )}

        {!loading && !error && !summary && (
          <div className="empty-state">
            <p>Select partner and month, then click "Get Summary"</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MonthlySummary;
