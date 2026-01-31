interface PartnerSelectorProps {
    partnerId: string;
    setPartnerId: (id: string) => void;
}

function PartnerSelector(props : PartnerSelectorProps) {
    const { partnerId, setPartnerId } = props;

	return (
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
	);
}

export default PartnerSelector;