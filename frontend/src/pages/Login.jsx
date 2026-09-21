import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (event) => {

        event.preventDefault();

        setMessage('');
        setLoading(true);

        try {

            const response = await fetch(
                'http://localhost:5000/api/auth/login',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setMessage(
                    data.message || 'Login failed'
                );

                return;
            }


            // Save login information

            localStorage.setItem(
                'token',
                data.token
            );

            localStorage.setItem(
                'user',
                JSON.stringify(data.user)
            );


            // Send user to the correct dashboard

            if (data.user.role === 'manager') {
                navigate('/manager');
            } else {
                navigate('/student');
            }

        } catch (error) {

            console.error(
                'Login error:',
                error
            );

            setMessage(
                'Unable to connect to the server.'
            );

        } finally {

            setLoading(false);
        }
    };


    return (
        <div className="auth-page">

            <div className="auth-card">

                <div className="auth-brand">
                    WashTrack
                </div>

                <h1>
                    Welcome Back
                </h1>

                <p className="auth-subtitle">
                    Log in to manage your laundry bookings and points.
                </p>


                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >

                    <div className="auth-form-group">

                        <label htmlFor="login-email">
                            Email
                        </label>

                        <input
                            id="login-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            required
                        />

                    </div>


                    <div className="auth-form-group">

                        <label htmlFor="login-password">
                            Password
                        </label>

                        <input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required
                        />

                    </div>


                    <button
                        className="auth-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? 'Logging in...'
                            : 'Log In'
                        }
                    </button>

                </form>


                {message && (
                    <div className="auth-error">
                        {message}
                    </div>
                )}


                <p className="auth-footer">
                    Don't have an account?{' '}
                    <Link to="/signup">
                        Create an account
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Login;