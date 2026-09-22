import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../api';

function Signup() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: '',
        password: '',
        role: 'student'
    });

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);


    const handleChange = (event) => {

        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };


    const handleSubmit = async (event) => {

        event.preventDefault();

        setMessage('');
        setLoading(true);

        try {

            const response = await fetch(
                `${API_URL}/api/auth/signup`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify(formData)
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setMessage(
                    data.message || 'Signup failed'
                );

                return;
            }


            setMessage(
                'Account created successfully!'
            );


            setTimeout(() => {
                navigate('/login');
            }, 1000);

        } catch (error) {

            console.error(
                'Signup error:',
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
                    Create Account
                </h1>

                <p className="auth-subtitle">
                    Create your account to start using WashTrack.
                </p>


                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >

                    <div className="auth-form-row">

                        <div className="auth-form-group">

                            <label htmlFor="signup-name">
                                Name
                            </label>

                            <input
                                id="signup-name"
                                type="text"
                                name="name"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />

                        </div>


                        <div className="auth-form-group">

                            <label htmlFor="signup-surname">
                                Surname
                            </label>

                            <input
                                id="signup-surname"
                                type="text"
                                name="surname"
                                placeholder="Enter your surname"
                                value={formData.surname}
                                onChange={handleChange}
                                required
                            />

                        </div>

                    </div>


                    <div className="auth-form-group">

                        <label htmlFor="signup-email">
                            Email
                        </label>

                        <input
                            id="signup-email"
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />

                    </div>


                    <div className="auth-form-group">

                        <label htmlFor="signup-password">
                            Password
                        </label>

                        <input
                            id="signup-password"
                            type="password"
                            name="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />

                    </div>


                    <div className="auth-form-group">

                        <label htmlFor="signup-role">
                            Account Type
                        </label>

                        <select
                            id="signup-role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                        >

                            <option value="student">
                                Student
                            </option>

                            <option value="manager">
                                Manager
                            </option>

                        </select>

                    </div>


                    <button
                        className="auth-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? 'Creating Account...'
                            : 'Create Account'
                        }
                    </button>

                </form>


                {message && (
                    <div
                        className={
                            message.includes('successfully')
                                ? 'auth-success'
                                : 'auth-error'
                        }
                    >
                        {message}
                    </div>
                )}


                <p className="auth-footer">
                    Already have an account?{' '}
                    <Link to="/login">
                        Log in
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Signup;