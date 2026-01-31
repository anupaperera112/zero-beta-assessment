interface DateSelectorProps {
    title: string;
	date: string;
	setDate: (id: string) => void;
}

function DateSelector(props: DateSelectorProps) {
	const { title, date, setDate } = props;

	return (
		<div className="form-group">
			<label htmlFor="toDate">{title}</label>
			<input
				required
				id="toDate"
				type="datetime-local"
				value={date}
				onChange={(e) => setDate(e.target.value)}
			/>
		</div>
	);
}

export default DateSelector;
