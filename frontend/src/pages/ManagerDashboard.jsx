import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../api';

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

    // Machine registration form
    const [showRegisterForm, setShowRegisterForm] = useState(false);

    const [machineForm, setMachineForm] = useState({
        machineId: '',
        name: '',
        type: 'washer',
        room: 'Laundry Room A'
    });

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
                `${API_URL}/api/manager/summary`,
                { headers }
            );

            const summaryData =
                await summaryResponse.json();

            if (summaryResponse.ok) {
                setSummary(summaryData);
            }


            // Machines

            const machineResponse = await fetch(
                `${API_URL}/api/manager/machines`,
                { headers }
            );

            const machineData =
                await machineResponse.json();

            if (machineResponse.ok) {
                setMachines(machineData);
            }


            // Fault reports

            const faultResponse = await fetch(
                `${API_URL}/api/manager/fault-reports`,
                { headers }
            );

            const faultData =
                await faultResponse.json();

            if (faultResponse.ok) {
                setFaultReports(faultData);
            }


            // Bookings

            const bookingResponse = await fetch(
                `${API_URL}/api/manager/bookings`,
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
    // MACHINE FORM INPUT
    // =====================================

    const handleMachineFormChange = (event) => {

        const {
            name,
            value
        } = event.target;

        setMachineForm(prev => ({
            ...prev,
            [name]: value
        }));
    };


    // =====================================
    // REGISTER MACHINE
    // =====================================

    const registerMachine = async (event) => {

        event.preventDefault();

        setMessage('');
        setError('');

        try {

            const response = await fetch(
                `${API_URL}/api/manager/machines`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify(machineForm)
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setError(
                    data.message ||
                    'Unable to register machine'
                );

                return;
            }

            setMessage(
                `${machineForm.machineId} registered successfully.`
            );

            // Clear form
            setMachineForm({
                machineId: '',
                name: '',
                type: 'washer',
                room: 'Laundry Room A'
            });

            setShowRegisterForm(false);

            loadData();

        } catch (err) {

            console.error(err);

            setError(
                'Unable to connect to the server.'
            );
        }
    };


    // =====================================
    // REMOVE MACHINE
    // =====================================

    const removeMachine = async (machineId) => {

        const confirmed = window.confirm(
            `Remove machine ${machineId} from service?`
        );

        if (!confirmed) {
            return;
        }

        setMessage('');
        setError('');

        try {

            const response = await fetch(
                `${API_URL}/api/manager/machines/${machineId}/remove`,
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
                    'Unable to remove machine'
                );

                return;
            }

            setMessage(
                `${machineId} has been removed from service.`
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
    // RESTORE MACHINE
    // =====================================

    const restoreMachine = async (machineId) => {

        setMessage('');
        setError('');

        try {

            const response = await fetch(
                `${API_URL}/api/manager/machines/${machineId}/restore`,
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
                    'Unable to restore machine'
                );

                return;
            }

            setMessage(
                `${machineId} has been restored successfully.`
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
    // RESOLVE FAULT
    // =====================================

    const resolveFault = async (reportId) => {

        setMessage('');
        setError('');

        try {

            const response = await fetch(
                `${API_URL}/api/manager/fault-reports/${reportId}/resolve`,
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
                `${API_URL}/api/manager/machines/${machineId}/status`,
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
    // MACHINE STATUS DISPLAY
    // =====================================

    const getMachineStatusClass = (machine) => {

        if (machine.active === false) {
            return 'status-inactive';
        }

        if (machine.status === 'working') {
            return 'status-working';
        }

        if (machine.status === 'occupied') {
            return 'status-occupied';
        }

        return 'status-broken';
    };


    const getMachineStatusText = (machine) => {

        if (machine.active === false) {
            return 'Out of Service';
        }

        if (machine.status === 'working') {
            return 'Available';
        }

        if (machine.status === 'occupied') {
            return 'Occupied';
        }

        return 'Broken';
    };


    // =====================================
    // LOADING
    // =====================================

    if (loading) {

        return (
            <div className="loading-screen">

                <div>
                    <h2>WashTrack</h2>

                    <p>
                        Loading manager dashboard...
                    </p>
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
                        Manager Dashboard · Welcome,{' '}
                        {user?.name} {user?.surname}
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

                <div className="section-heading-row">

                    <div>
                        <h2 className="section-title">
                            Dashboard Overview
                        </h2>

                        <p className="section-description">
                            Monitor laundry operations and machine activity.
                        </p>
                    </div>

                </div>


                {summary && (

                    <div className="summary-grid">

                        <div className="summary-card summary-card-main">

                            <span className="summary-icon">
                                🧺
                            </span>

                            <span className="summary-label">
                                Total Machines
                            </span>

                            <strong className="summary-number">
                                {summary.totalMachines}
                            </strong>

                        </div>


                        <div className="summary-card">

                            <span className="summary-icon">
                                ✓
                            </span>

                            <span className="summary-label">
                                Available
                            </span>

                            <strong className="summary-number">
                                {summary.available}
                            </strong>

                        </div>


                        <div className="summary-card">

                            <span className="summary-icon">
                                ◷
                            </span>

                            <span className="summary-label">
                                Occupied
                            </span>

                            <strong className="summary-number">
                                {summary.occupied}
                            </strong>

                        </div>


                        <div className="summary-card">

                            <span className="summary-icon">
                                !
                            </span>

                            <span className="summary-label">
                                Broken
                            </span>

                            <strong className="summary-number">
                                {summary.broken}
                            </strong>

                        </div>


                        <div className="summary-card">

                            <span className="summary-icon">
                                ⚠
                            </span>

                            <span className="summary-label">
                                Open Faults
                            </span>

                            <strong className="summary-number">
                                {summary.openFaults}
                            </strong>

                        </div>


                        <div className="summary-card">

                            <span className="summary-icon">
                                #
                            </span>

                            <span className="summary-label">
                                Active Bookings
                            </span>

                            <strong className="summary-number">
                                {summary.activeBookings}
                            </strong>

                        </div>


                        <div className="summary-card">

                            <span className="summary-icon">
                                ●
                            </span>

                            <span className="summary-label">
                                Active Inventory
                            </span>

                            <strong className="summary-number">
                                {summary.activeMachines}
                            </strong>

                        </div>


                        <div className="summary-card">

                            <span className="summary-icon">
                                —
                            </span>

                            <span className="summary-label">
                                Out of Service
                            </span>

                            <strong className="summary-number">
                                {summary.inactiveMachines}
                            </strong>

                        </div>

                    </div>

                )}

            </section>


            {/* =========================
                MACHINE INVENTORY
            ========================= */}

            <section className="dashboard-section">

                <div className="section-heading-row">

                    <div>

                        <h2 className="section-title">
                            Machine Inventory
                        </h2>

                        <p className="section-description">
                            Register, manage and maintain laundry machines.
                        </p>

                    </div>


                    <button
                        className="primary-button register-machine-button"
                        onClick={() => {
                            setShowRegisterForm(
                                !showRegisterForm
                            );

                            setMessage('');
                            setError('');
                        }}
                    >
                        {showRegisterForm
                            ? 'Close Form'
                            : '+ Register Machine'
                        }
                    </button>

                </div>


                {/* REGISTER FORM */}

                {showRegisterForm && (

                    <div className="register-machine-panel">

                        <div className="register-panel-header">

                            <div>

                                <h3>
                                    Register New Machine
                                </h3>

                                <p>
                                    Add a new washer or dryer to the laundry inventory.
                                </p>

                            </div>

                        </div>


                        <form
                            className="machine-form"
                            onSubmit={registerMachine}
                        >

                            <div className="machine-form-grid">

                                <div className="auth-form-group">

                                    <label htmlFor="machineId">
                                        Machine ID
                                    </label>

                                    <input
                                        id="machineId"
                                        name="machineId"
                                        type="text"
                                        placeholder="Example: W9"
                                        value={machineForm.machineId}
                                        onChange={handleMachineFormChange}
                                        required
                                    />

                                </div>


                                <div className="auth-form-group">

                                    <label htmlFor="name">
                                        Machine Name
                                    </label>

                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="Example: Washer 9"
                                        value={machineForm.name}
                                        onChange={handleMachineFormChange}
                                        required
                                    />

                                </div>


                                <div className="auth-form-group">

                                    <label htmlFor="type">
                                        Machine Type
                                    </label>

                                    <select
                                        id="type"
                                        name="type"
                                        value={machineForm.type}
                                        onChange={handleMachineFormChange}
                                    >
                                        <option value="washer">
                                            Washer
                                        </option>

                                        <option value="dryer">
                                            Dryer
                                        </option>
                                    </select>

                                </div>


                                <div className="auth-form-group">

                                    <label htmlFor="room">
                                        Laundry Room
                                    </label>

                                    <select
                                        id="room"
                                        name="room"
                                        value={machineForm.room}
                                        onChange={handleMachineFormChange}
                                    >
                                        <option value="Laundry Room A">
                                            Laundry Room A
                                        </option>

                                        <option value="Laundry Room B">
                                            Laundry Room B
                                        </option>
                                    </select>

                                </div>

                            </div>


                            <div className="form-actions">

                                <button
                                    type="submit"
                                    className="primary-button"
                                >
                                    Register Machine
                                </button>

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                        setShowRegisterForm(false)
                                    }
                                >
                                    Cancel
                                </button>

                            </div>

                        </form>

                    </div>

                )}


                {/* MACHINE LIST */}

                <div className="inventory-summary">

                    <span>
                        {machines.filter(
                            machine => machine.active !== false
                        ).length}{' '}
                        active machines
                    </span>

                    <span>
                        {machines.filter(
                            machine => machine.active === false
                        ).length}{' '}
                        out of service
                    </span>

                </div>


                <div className="machine-grid">

                    {machines.map(machine => (

                        <div
                            key={machine._id}
                            className={`machine-card ${
                                machine.active === false
                                    ? 'machine-card-inactive'
                                    : ''
                            }`}
                        >

                            <div className="machine-card-top">

                                <div>

                                    <h3>
                                        {machine.name}
                                    </h3>

                                    <p className="machine-id">
                                        {machine.machineId}
                                    </p>

                                </div>

                                <span
                                    className={`machine-status ${getMachineStatusClass(machine)}`}
                                >
                                    {getMachineStatusText(machine)}
                                </span>

                            </div>


                            <div className="machine-card-details">

                                <span>
                                    <strong>Room</strong>
                                    {machine.room}
                                </span>

                                <span>
                                    <strong>Type</strong>
                                    {machine.type}
                                </span>

                            </div>


                            {machine.active !== false && (
                                <div className="machine-actions">

                                    {machine.status === 'broken' && (

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

                                    )}


                                    {machine.status !== 'occupied' && (

                                        <button
                                            className="danger-button"
                                            onClick={() =>
                                                removeMachine(
                                                    machine.machineId
                                                )
                                            }
                                        >
                                            Remove from Service
                                        </button>

                                    )}

                                    {machine.status === 'occupied' && (

                                        <p className="machine-action-note">
                                            This machine is currently occupied and cannot be removed.
                                        </p>

                                    )}

                                </div>
                            )}


                            {machine.active === false && (

                                <div className="machine-actions">

                                    <p className="machine-action-note">
                                        This machine is currently not available to students.
                                    </p>

                                    <button
                                        className="secondary-button"
                                        onClick={() =>
                                            restoreMachine(
                                                machine.machineId
                                            )
                                        }
                                    >
                                        Restore Machine
                                    </button>

                                </div>

                            )}

                        </div>

                    ))}

                </div>

            </section>


            {/* =========================
                FAULT REPORTS
            ========================= */}

            <section className="dashboard-section">

                <div className="section-heading-row">

                    <div>

                        <h2 className="section-title">
                            Fault Reports
                        </h2>

                        <p className="section-description">
                            Review reported machine problems and resolve faults.
                        </p>

                    </div>

                </div>


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
                ALL BOOKINGS
            ========================= */}

            <section className="dashboard-section">

                <div className="section-heading-row">

                    <div>

                        <h2 className="section-title">
                            All Bookings
                        </h2>

                        <p className="section-description">
                            View current and historical machine bookings.
                        </p>

                    </div>

                </div>


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