import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function StudentDashboard() {

    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [machines, setMachines] = useState([]);
    const [bookings, setBookings] = useState([]);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [faultMachine, setFaultMachine] = useState('');
    const [faultDescription, setFaultDescription] = useState('');
    const [faultReports, setFaultReports] = useState([]);

    const token = localStorage.getItem('token');

    // =========================
    // LOAD DATA
    // =========================

    const loadData = async () => {

        try {

            const userResponse = await fetch(
                'http://localhost:5000/api/auth/me',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const userData = await userResponse.json();

            if (userResponse.ok) {
                setUser(userData);

                localStorage.setItem(
                    'user',
                    JSON.stringify(userData)
                );
            }

            const machineResponse = await fetch(
                'http://localhost:5000/api/machines'
            );

            const machineData = await machineResponse.json();

            if (machineResponse.ok) {
                setMachines(machineData);
            }

            const bookingResponse = await fetch(
                'http://localhost:5000/api/bookings/my',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const bookingData = await bookingResponse.json();

            if (bookingResponse.ok) {
                setBookings(bookingData);
            }

            const faultResponse = await fetch(
                'http://localhost:5000/api/fault-reports/my',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const faultData = await faultResponse.json();

            if (faultResponse.ok) {
                setFaultReports(faultData);
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

        if (!token || !user) {
            navigate('/login');
            return;
        }

        if (user.role !== 'student') {
            navigate('/manager');
            return;
        }

        loadData();

        // Refresh machine and booking data every 10 seconds
        const refreshTimer = setInterval(() => {
            loadData();
        }, 10000);

        return () => {
            clearInterval(refreshTimer);
        };

    }, []);


    // =========================
    // COUNTDOWN TIMER
    // =========================

    const getTimeRemaining = (endTime) => {

        const difference =
            new Date(endTime).getTime() - Date.now();

        if (difference <= 0) {
            return 'Expiring...';
        }

        const minutes = Math.floor(
            difference / (1000 * 60)
        );

        const seconds = Math.floor(
            (difference % (1000 * 60)) / 1000
        );

        return `${minutes}m ${seconds}s remaining`;
    };


    // Refresh the countdown every second
    const [, setCurrentTime] = useState(Date.now());

    useEffect(() => {

        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => clearInterval(timer);

    }, []);

    const handleReportFault = async (e) => {

        e.preventDefault();

        setMessage('');
        setError('');

        if (!faultMachine || !faultDescription.trim()) {

            setError(
                'Please select a machine and describe the fault.'
            );

            return;
        }

        try {

            const response = await fetch(
                'http://localhost:5000/api/fault-reports',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        machineId: faultMachine,
                        description: faultDescription
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setError(
                    data.message ||
                    'Unable to submit fault report'
                );

                return;
            }

            setMessage(
                data.bookingCancelled
                    ? `Fault reported successfully for machine ${faultMachine}. The active booking was cancelled and your point was refunded.`
                    : `Fault reported successfully for machine ${faultMachine}.`
            );

            setFaultReports(previousReports => [
                data.report,
                ...previousReports
            ]);

            setMachines(previousMachines =>
                previousMachines.map(machine =>
                    machine.machineId === faultMachine
                        ? {
                            ...machine,
                            status: 'broken',
                            bookedUntil: null
                        }
                        : machine
                )
            );

// Refresh bookings and user points from the database
            await loadData();

            setFaultMachine('');
            setFaultDescription('');

        } catch (err) {

            console.error(err);

            setError(
                'Unable to connect to the WashTrack server.'
            );
        }
    };


    // =========================
    // BOOK MACHINE
    // =========================

    const handleBookMachine = async (machineId) => {

        setMessage('');
        setError('');

        // Check whether the student already has an active booking
        const activeBooking = bookings.find(
            booking => booking.status === 'active'
        );

        if (activeBooking) {

            setError(
                'You already have an active booking. Please wait until it is completed before booking another machine.'
            );

            return;
        }

        try {

            const response = await fetch(
                'http://localhost:5000/api/bookings',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        machineId
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setError(
                    data.message || 'Unable to book machine'
                );

                return;
            }

            // Update points
            const updatedUser = {
                ...user,
                points: data.pointsRemaining
            };

            setUser(updatedUser);

            localStorage.setItem(
                'user',
                JSON.stringify(updatedUser)
            );

            // Update machine status
            setMachines(previousMachines =>
                previousMachines.map(machine =>
                    machine.machineId === machineId
                        ? {
                            ...machine,
                            status: 'occupied',
                            bookedUntil: data.booking.endTime
                        }
                        : machine
                )
            );

            // Add booking to the beginning of booking history
            setBookings(previousBookings => [
                {
                    _id: data.booking.id,
                    status: data.booking.status,
                    startTime: data.booking.startTime,
                    endTime: data.booking.endTime,
                    machine: {
                        machineId: data.booking.machine
                    }
                },
                ...previousBookings
            ]);

            setMessage(
                `Machine ${machineId} booked successfully.`
            );

        } catch (err) {

            console.error(err);

            setError(
                'Unable to connect to the WashTrack server.'
            );

        }
    };

    const handleCancelBooking = async (bookingId) => {

        setMessage('');
        setError('');

        try {

            const response = await fetch(
                `http://localhost:5000/api/bookings/${bookingId}/cancel`,
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
                    'Unable to cancel booking'
                );
                return;
            }

            setMessage('Booking cancelled successfully.');

            await loadData();

        } catch (err) {

            console.error(err);

            setError(
                'Unable to connect to the WashTrack server.'
            );
        }
    };


    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        navigate('/login');
    };


    // =========================
    // MACHINE GROUPING
    // =========================

    const roomA = machines.filter(
        machine => machine.room === 'Laundry Room A'
    );

    const roomB = machines.filter(
        machine => machine.room === 'Laundry Room B'
    );


    // =========================
    // FORMAT DATE
    // =========================

    const formatDate = (date) => {

        return new Date(date).toLocaleString(
            'en-ZA',
            {
                dateStyle: 'medium',
                timeStyle: 'short'
            }
        );
    };


    // =========================
    // MACHINE DISPLAY
    // =========================

    const renderMachine = (machine) => {

        const isAvailable =
            machine.status === 'working';

        return (
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
                    Type: {machine.type}
                </p>

                <p
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
                </p>

                {machine.bookedUntil && machine.status === 'occupied' && (
                    <p className="machine-countdown">
                        {getTimeRemaining(machine.bookedUntil)}
                    </p>
                )}

                {isAvailable && (
                    <button
                        className="primary-button"
                        onClick={() =>
                            handleBookMachine(
                                machine.machineId
                            )
                        }
                    >
                        Book Machine
                    </button>
                )}

            </div>
        );
    };


    if (loading) {

        return (
            <div>
                <h2>WashTrack</h2>
                <p>Loading dashboard...</p>
            </div>
        );
    }


    return (
        <div className="dashboard">

            {/* HEADER */}

            <div className="dashboard-header">

                <div className="brand">
                    <h1>WashTrack</h1>

                    <p>
                        Welcome, {user?.name} {user?.surname}
                    </p>
                </div>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>


            {/* POINTS */}

            <div className="points-card">
                <h2>
                    Laundry Points
                </h2>

                <p>
                    <strong className="points-number">
                        {user?.points}
                    </strong>{' '}
                    <span className="points-label">
        points remaining
    </span>
                </p>

            </div>


            {/* MESSAGES */}

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


            {/* ACTIVE BOOKING */}

            <section>

                <h2>
                    Current Booking
                </h2>

                {bookings.filter(
                    booking => booking.status === 'active'
                ).length === 0 ? (

                    <p>
                        You do not have an active booking.
                    </p>

                ) : (

                    bookings
                        .filter(
                            booking =>
                                booking.status === 'active'
                        )
                        .map(booking => (

                            <div
                                key={booking._id}
                                style={{
                                    border: '1px solid #ddd',
                                    borderRadius: '10px',
                                    padding: '15px',
                                    marginBottom: '15px'
                                }}
                            >

                                <h3>
                                    Machine{' '}
                                    {booking.machine?.machineId}
                                </h3>

                                <p>
                                    Status:{' '}
                                    <strong>
                                        Active
                                    </strong>
                                </p>

                                <p>
                                    Start:{' '}
                                    {formatDate(
                                        booking.startTime
                                    )}
                                </p>

                                <p>
                                    End:{' '}
                                    {formatDate(
                                        booking.endTime
                                    )}
                                </p>

                                <p>
                                    <strong>
                                        {getTimeRemaining(
                                            booking.endTime
                                        )}
                                    </strong>
                                </p>

                            </div>

                        ))

                )}

            </section>


            {/* MACHINES */}

            <section className="dashboard-section">

                <h2 className="section-title">
                    Laundry Room A
                </h2>

                <div className="machine-grid">
                    {roomA.map(renderMachine)}
                </div>

            </section>


            <section className="dashboard-section">

                <h2 className="section-title">
                    Laundry Room B
                </h2>

                <div className="machine-grid">
                    {roomB.map(renderMachine)}
                </div>

            </section>


            {/* BOOKING HISTORY */}

            <section>

                <h2>
                    My Bookings
                </h2>

                {bookings.length === 0 ? (

                    <p>
                        You have no bookings yet.
                    </p>

                ) : (

                    bookings.map(booking => (

                        <div
                            key={booking._id}
                            style={{
                                border: '1px solid #ddd',
                                borderRadius: '10px',
                                padding: '15px',
                                marginBottom: '10px'
                            }}
                        >
                            {booking.status === 'active' && (
                                <button
                                    onClick={() => handleCancelBooking(booking._id)}
                                >
                                    Cancel Booking
                                </button>
                            )}

                            <h3>
                                Machine{' '}
                                {booking.machine?.machineId}
                            </h3>

                            <p>
                                Status:{' '}
                                <strong>
                                    {booking.status}
                                </strong>
                            </p>

                            <p>
                                Start:{' '}
                                {formatDate(
                                    booking.startTime
                                )}
                            </p>

                            <p>
                                End:{' '}
                                {formatDate(
                                    booking.endTime
                                )}
                            </p>

                        </div>

                    ))

                )}

            </section>


            {/* FUTURE FAULT REPORT */}

            {/* REPORT A FAULT */}

            <section>

                <h2>
                    Report a Fault
                </h2>

                <form onSubmit={handleReportFault}>

                    <div>

                        <label>
                            Machine
                        </label>

                        <br />

                        <select
                            value={faultMachine}
                            onChange={(e) =>
                                setFaultMachine(e.target.value)
                            }
                        >

                            <option value="">
                                Select a machine
                            </option>

                            {machines.map(machine => (

                                <option
                                    key={machine._id}
                                    value={machine.machineId}
                                >
                                    {machine.machineId} - {machine.name}
                                </option>

                            ))}

                        </select>

                    </div>


                    <br />


                    <div>

                        <label>
                            Describe the problem
                        </label>

                        <br />

                        <textarea
                            value={faultDescription}
                            onChange={(e) =>
                                setFaultDescription(e.target.value)
                            }
                            placeholder="Describe the problem with the machine..."
                            rows="4"
                            cols="50"
                        />

                    </div>


                    <br />


                    <button type="submit">
                        Submit Fault Report
                    </button>

                </form>

            </section>


            {/* MY FAULT REPORTS */}

            <section>

                <h2>
                    My Fault Reports
                </h2>

                {faultReports.length === 0 ? (

                    <p>
                        You have not reported any faults.
                    </p>

                ) : (

                    faultReports.map(report => (

                        <div
                            key={report._id}
                            style={{
                                border: '1px solid #ddd',
                                borderRadius: '10px',
                                padding: '15px',
                                marginBottom: '10px'
                            }}
                        >

                            <h3>
                                Machine{' '}
                                {report.machine?.machineId}
                            </h3>

                            <p>
                                Room:{' '}
                                {report.machine?.room}
                            </p>

                            <p>
                                Problem:{' '}
                                {report.description}
                            </p>

                            <p>
                                Status:{' '}
                                <strong>
                                    {report.status}
                                </strong>
                            </p>

                            <p>
                                Reported:{' '}
                                {formatDate(report.createdAt)}
                            </p>

                        </div>

                    ))

                )}

            </section>

        </div>
    );
}

export default StudentDashboard;