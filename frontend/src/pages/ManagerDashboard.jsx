import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ManagerDashboard() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);

    const [summary, setSummary] = useState(null);
    const [machines, setMachines] = useState([]);
    const [faultReports, setFaultReports] = useState([]);
    const [bookings, setBookings] = useState([]);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');


    // =====================================
    // LOAD MANAGER DATA
    // =====================================

    const loadData = async () => {

        try {

            const headers = {
                Authorization: `Bearer ${token}`
            };


            // Summary

            const summaryResponse = await fetch(
                'http://localhost:5000/api/manager/summary',
                { headers }
            );

            const summaryData =
                await summaryResponse.json();

            if (summaryResponse.ok) {
                setSummary(summaryData);
            }


            // Machines

            const machineResponse = await fetch(
                'http://localhost:5000/api/manager/machines',
                { headers }
            );

            const machineData =
                await machineResponse.json();

            if (machineResponse.ok) {
                setMachines(machineData);
            }


            // Fault reports

            const faultResponse = await fetch(
                'http://localhost:5000/api/manager/fault-reports',
                { headers }
            );

            const faultData =
                await faultResponse.json();

            if (faultResponse.ok) {
                setFaultReports(faultData);
            }


            // Bookings

            const bookingResponse = await fetch(
                'http://localhost:5000/api/manager/bookings',
                { headers }
            );

            const bookingData =
                await bookingResponse.json();

            if (bookingResponse.ok) {
                setBookings(bookingData);
            }

        } catch (err) {

            console.error(err);

            setError(
                'Unable to connect to the WashTrack server.'
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {

        const savedUser =
            localStorage.getItem('user');

        if (!token || !savedUser) {
            navigate('/login');
            return;
        }

        const loggedInUser =
            JSON.parse(savedUser);

        if (loggedInUser.role !== 'manager') {
            navigate('/student');
            return;
        }

        setUser(loggedInUser);

        loadData();

        // Refresh manager data every 10 seconds
        const refreshTimer = setInterval(() => {
            loadData();
        }, 10000);

        return () => {
            clearInterval(refreshTimer);
        };

    }, []);


    // =====================================
    // RESOLVE FAULT
    // =====================================

    const resolveFault = async (reportId) => {

        setMessage('');
        setError('');

        try {

            const response = await fetch(
                `http://localhost:5000/api/manager/fault-reports/${reportId}/resolve`,
                {
                    method: 'PUT',

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setError(
                    data.message ||
                    'Unable to resolve fault'
                );

                return;
            }

            setMessage(
                'Fault resolved successfully.'
            );

            loadData();

        } catch (err) {

            console.error(err);

            setError(
                'Unable to connect to the server.'
            );
        }
    };


    // =====================================
    // UPDATE MACHINE STATUS
    // =====================================

    const updateMachineStatus = async (
        machineId,
        status
    ) => {

        setMessage('');
        setError('');

        try {

            const response = await fetch(
                `http://localhost:5000/api/manager/machines/${machineId}/status`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        status
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setError(
                    data.message ||
                    'Unable to update machine'
                );

                return;
            }

            setMessage(
                `${machineId} status updated successfully.`
            );

            loadData();

        } catch (err) {

            console.error(err);

            setError(
                'Unable to connect to the server.'
            );
        }
    };


    // =====================================
    // LOGOUT
    // =====================================

    const handleLogout = () => {

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        navigate('/login');
    };


    // =====================================
    // DATE FORMAT
    // =====================================

    const formatDate = (date) => {

        return new Date(date).toLocaleString(
            'en-ZA',
            {
                dateStyle: 'medium',
                timeStyle: 'short'
            }
        );
    };


    // =====================================
    // LOADING
    // =====================================

    if (loading) {

        return (
            <div className="loading-screen">
                <div>
                    <h2>WashTrack</h2>
                    <p>Loading manager dashboard...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="dashboard">

            {/* =========================
                HEADER
            ========================= */}

            <div className="dashboard-header">

                <div className="brand">

                    <h1>
                        WashTrack
                    </h1>

                    <p>
                        Manager Dashboard · Welcome, {user?.name} {user?.surname}
                    </p>

                </div>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>


            {/* =========================
                MESSAGES
            ========================= */}

            {message && (
                <div className="success-message">
                    {message}
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}


            {/* =========================
                DASHBOARD OVERVIEW
            ========================= */}

            <section className="dashboard-section">

                <h2 className="section-title">
                    Dashboard Overview
                </h2>

                {summary && (

                    <div className="summary-grid">

                        <div className="summary-card">
                            <span className="summary-label">
                                Total Machines
                            </span>

                            <strong className="summary-number">
                                {summary.totalMachines}
                            </strong>
                        </div>


                        <div className="summary-card">
                            <span className="summary-label">
                                Available
                            </span>

                            <strong className="summary-number">
                                {summary.available}
                            </strong>
                        </div>


                        <div className="summary-card">
                            <span className="summary-label">
                                Occupied
                            </span>

                            <strong className="summary-number">
                                {summary.occupied}
                            </strong>
                        </div>


                        <div className="summary-card">
                            <span className="summary-label">
                                Broken
                            </span>

                            <strong className="summary-number">
                                {summary.broken}
                            </strong>
                        </div>


                        <div className="summary-card">
                            <span className="summary-label">
                                Open Faults
                            </span>

                            <strong className="summary-number">
                                {summary.openFaults}
                            </strong>
                        </div>


                        <div className="summary-card">
                            <span className="summary-label">
                                Active Bookings
                            </span>

                            <strong className="summary-number">
                                {summary.activeBookings}
                            </strong>
                        </div>

                    </div>
                )}

            </section>


            {/* =========================
                FAULT REPORTS
            ========================= */}

            <section className="dashboard-section">

                <h2 className="section-title">
                    Fault Reports
                </h2>

                {faultReports.length === 0 ? (

                    <div className="empty-state">
                        <p>
                            No fault reports.
                        </p>
                    </div>

                ) : (

                    faultReports.map(report => (

                        <div
                            key={report._id}
                            className="fault-card"
                        >

                            <div className="card-header-row">

                                <div>
                                    <h3>
                                        Machine {report.machine?.machineId}
                                    </h3>

                                    <p className="machine-id">
                                        {report.machine?.name}
                                    </p>
                                </div>

                                <span
                                    className={`fault-status ${
                                        report.status === 'open'
                                            ? 'fault-open'
                                            : 'fault-resolved'
                                    }`}
                                >
                                    {report.status}
                                </span>

                            </div>


                            <div className="details-grid">

                                <div>
                                    <span className="detail-label">
                                        Student
                                    </span>

                                    <p>
                                        {report.student?.name}{' '}
                                        {report.student?.surname}
                                    </p>
                                </div>


                                <div>
                                    <span className="detail-label">
                                        Email
                                    </span>

                                    <p>
                                        {report.student?.email}
                                    </p>
                                </div>


                                <div>
                                    <span className="detail-label">
                                        Room
                                    </span>

                                    <p>
                                        {report.machine?.room}
                                    </p>
                                </div>


                                <div>
                                    <span className="detail-label">
                                        Reported
                                    </span>

                                    <p>
                                        {formatDate(
                                            report.createdAt
                                        )}
                                    </p>
                                </div>

                            </div>


                            <div className="problem-box">

                                <span className="detail-label">
                                    Problem
                                </span>

                                <p>
                                    {report.description}
                                </p>

                            </div>


                            {report.status === 'open' && (

                                <button
                                    className="primary-button"
                                    onClick={() =>
                                        resolveFault(
                                            report._id
                                        )
                                    }
                                >
                                    Resolve Fault
                                </button>

                            )}

                        </div>

                    ))

                )}

            </section>


            {/* =========================
                MACHINE MANAGEMENT
            ========================= */}

            <section className="dashboard-section">

                <h2 className="section-title">
                    Machine Management
                </h2>

                <div className="machine-grid">

                    {machines.map(machine => (

                        <div
                            key={machine._id}
                            className="machine-card"
                        >

                            <h3>
                                {machine.name}
                            </h3>

                            <p className="machine-id">
                                Machine ID: {machine.machineId}
                            </p>

                            <p className="machine-type">
                                {machine.room} · {machine.type}
                            </p>

                            <span
                                className={`machine-status ${
                                    machine.status === 'working'
                                        ? 'status-working'
                                        : machine.status === 'occupied'
                                            ? 'status-occupied'
                                            : 'status-broken'
                                }`}
                            >
                                {machine.status === 'working'
                                    ? 'Available'
                                    : machine.status === 'occupied'
                                        ? 'Occupied'
                                        : 'Broken'
                                }
                            </span>


                            {machine.status === 'broken' && (

                                <div className="machine-action">

                                    <button
                                        className="primary-button"
                                        onClick={() =>
                                            updateMachineStatus(
                                                machine.machineId,
                                                'working'
                                            )
                                        }
                                    >
                                        Mark as Working
                                    </button>

                                </div>

                            )}

                        </div>

                    ))}

                </div>

            </section>


            {/* =========================
                ALL BOOKINGS
            ========================= */}

            <section className="dashboard-section">

                <h2 className="section-title">
                    All Bookings
                </h2>

                {bookings.length === 0 ? (

                    <div className="empty-state">
                        <p>
                            No bookings found.
                        </p>
                    </div>

                ) : (

                    bookings.map(booking => (

                        <div
                            key={booking._id}
                            className="booking-card"
                        >

                            <div className="card-header-row">

                                <div>

                                    <h3>
                                        Machine {booking.machine?.machineId}
                                    </h3>

                                    <p className="machine-id">
                                        {booking.machine?.name}
                                    </p>

                                </div>

                                <span
                                    className={`booking-status ${
                                        booking.status === 'active'
                                            ? 'booking-active'
                                            : booking.status === 'completed'
                                                ? 'booking-completed'
                                                : 'booking-cancelled'
                                    }`}
                                >
                                    {booking.status}
                                </span>

                            </div>


                            <div className="details-grid">

                                <div>
                                    <span className="detail-label">
                                        Student
                                    </span>

                                    <p>
                                        {booking.user?.name}{' '}
                                        {booking.user?.surname}
                                    </p>
                                </div>


                                <div>
                                    <span className="detail-label">
                                        Email
                                    </span>

                                    <p>
                                        {booking.user?.email}
                                    </p>
                                </div>


                                <div>
                                    <span className="detail-label">
                                        Start
                                    </span>

                                    <p>
                                        {formatDate(
                                            booking.startTime
                                        )}
                                    </p>
                                </div>


                                <div>
                                    <span className="detail-label">
                                        End
                                    </span>

                                    <p>
                                        {formatDate(
                                            booking.endTime
                                        )}
                                    </p>
                                </div>

                            </div>

                        </div>

                    ))

                )}

            </section>

        </div>
    );
}

export default ManagerDashboard;