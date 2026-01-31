import { useState, useEffect } from "react";
import { api, ErrorEvent } from "../api";
import "./ErrorsView.css";
import PartnerSelector from "../components/PartnerSelector";
import DateSelector from "../components/DateSelector";
import ErrorScreen from "../components/LoadingScreen";

function ErrorsView() {
	const [errors, setErrors] = useState<ErrorEvent[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [partnerId, setPartnerId] = useState<string>("");
	const [fromDate, setFromDate] = useState<string>("");
	const [toDate, setToDate] = useState<string>("");

	const fetchErrors = async () => {
		setLoading(true);
		setError(null);
		try {
			// Convert date inputs to ISO 8601 format
			const from = fromDate ? new Date(fromDate).toISOString() : undefined;
			const to = toDate ? new Date(toDate).toISOString() : undefined;

			const errorList = await api.getErrors(partnerId || undefined, from, to);
			setErrors(errorList);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch errors");
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		fetchErrors();
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	return (
		<div className="errors-view">
			<div className="card">
				<h2 className="card-title">Validation Errors</h2>

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

				{error && <ErrorScreen error={error} />}

				{loading && <div className="loading">Loading errors...</div>}

				{!loading && !error && (
					<>
						{errors.length === 0 ? (
							<div className="empty-state">
								<p>No validation errors found</p>
							</div>
						) : (
							<div className="errors-list">
								{errors.map((errorEvent, index) => (
									<div key={index} className="error-item">
										<div className="error-header">
											<span className="error-partner">
												Partner {errorEvent.partnerId}
											</span>
											<span className="error-time">
												{formatDate(errorEvent.receivedTime)}
											</span>
										</div>
										<div className="error-payload">
											<strong>Payload:</strong>
											<pre>
												{JSON.stringify(errorEvent.rawPayload, null, 2)}
											</pre>
										</div>
										<div className="error-messages">
											<strong>Validation Errors:</strong>
											<ul>
												{errorEvent.validationErrors.map((err, i) => (
													<li key={i}>{err}</li>
												))}
											</ul>
										</div>
									</div>
								))}
								<div className="results-info">
									Showing {errors.length} error{errors.length !== 1 ? "s" : ""}
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}

export default ErrorsView;
