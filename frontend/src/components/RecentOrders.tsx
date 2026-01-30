import { useState, useEffect } from 'react';
import { api, OrderEvent } from '../api';
import './RecentOrders.css';

function RecentOrders() {
  const [orders, setOrders] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string>('');
  const [limit, setLimit] = useState<number>(50);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const allOrders = await api.getOrders(partnerId || undefined);
      // Limit the results
      const limitedOrders = allOrders.slice(0, limit);
      setOrders(limitedOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="recent-orders">
      <div className="card">
        <h2 className="card-title">Recent Orders</h2>
        
        <form onSubmit={handleSubmit} className="filter-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="partnerId">Partner ID</label>
              <select
                id="partnerId"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
              >
                <option value="">All Partners</option>
                <option value="A">Partner A</option>
                <option value="B">Partner B</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="limit">Limit</label>
              <input
                id="limit"
                type="number"
                min="1"
                max="1000"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              />
            </div>
          </div>
          
          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {loading && <div className="loading">Loading orders...</div>}

        {!loading && !error && (
          <>
            {orders.length === 0 ? (
              <div className="empty-state">
                <p>No orders found</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Product Code</th>
                      <th>Net Amount</th>
                      <th>Partner</th>
                      <th>Sequence #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, index) => (
                      <tr key={`${order.partnerId}-${order.sequenceNumber}-${index}`}>
                        <td>{formatDate(order.eventTime)}</td>
                        <td>{order.productCode}</td>
                        <td>${order.netAmount.toFixed(2)}</td>
                        <td>{order.partnerId}</td>
                        <td>{order.sequenceNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="results-info">
                  Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default RecentOrders;
