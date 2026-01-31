import { useState } from "react";
import { api, OrderEvent } from "../api";
import "./RecentOrders.css";
import PartnerSelector from "../components/PartnerSelector";
import DateSelector from "../components/DateSelector";

function RecentOrders() {
	const [orders, setOrders] = useState<OrderEvent[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [partnerId, setPartnerId] = useState<string>("");
	const [fromDate, setFromDate] = useState<string>("");
	const [toDate, setToDate] = useState<string>("");

	const fetchOrders = async () => {
		setLoading(true);
		setError(null);
		try {
			// Convert date inputs to ISO 8601 format
			const from = fromDate ? new Date(fromDate).toISOString() : undefined;
			const to = toDate ? new Date(toDate).toISOString() : undefined;

			const allOrders = await api.getOrders(partnerId || undefined, from, to);
			setOrders(allOrders);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch orders");
		} finally {
			setLoading(false);
		}
	};

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
						<PartnerSelector
							partnerId={partnerId}
							setPartnerId={setPartnerId}
						/>

						<DateSelector
							title="From Date"
							date={fromDate}
							setDate={setFromDate}
						/>

						<DateSelector title="To Date" date={toDate} setDate={setToDate} />
					</div>

					<div className="form-actions">
						<button type="submit" className="button" disabled={loading}>
							{loading ? "Loading..." : "Refresh"}
						</button>
						<button
							type="button"
							className="button button-secondary"
							onClick={() => {
								setFromDate("");
								setToDate("");
								setPartnerId("");
							}}
						>
							Clear Filters
						</button>
					</div>
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
											<tr
												key={`${order.partnerId}-${order.sequenceNumber}-${index}`}
											>
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
									Showing {orders.length} order{orders.length !== 1 ? "s" : ""}
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
