interface ErrorScreenProps {
	error: string;
}

function ErrorScreen(props: ErrorScreenProps) {
	const { error } = props;
	return <div className="error">{error}</div>;
}

export default ErrorScreen;
