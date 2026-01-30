import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RecentOrders from './components/RecentOrders';
import MonthlySummary from './components/MonthlySummary';
import ErrorsView from './components/ErrorsView';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-title">ZeroBeta Order Dashboard</h1>
            <div className="nav-links">
              <Link to="/" className="nav-link">Recent Orders</Link>
              <Link to="/summary" className="nav-link">Monthly Summary</Link>
              <Link to="/errors" className="nav-link">Errors</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<RecentOrders />} />
            <Route path="/summary" element={<MonthlySummary />} />
            <Route path="/errors" element={<ErrorsView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
