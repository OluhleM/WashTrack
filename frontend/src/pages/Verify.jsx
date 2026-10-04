import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API_URL from '../api';

function Verify() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const email = state?.email || '';

    const [digits, setDigits] = useState(Array(6).fill(''));
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(30);
    const refs = useRef([]);

    useEffect(() => {
        if (!email) navigate('/signup');
        else refs.current[0]?.focus();
    }, [email, navigate]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const post = async (path, body) => {
        const res = await fetch(`${API_URL}/api/auth/${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return { ok: res.ok, data: await res.json().catch(() => ({})) };
    };

    const verify = async (list = digits) => {
        const code = list.join('');
        if (code.length < 6) return setMessage('Enter all 6 digits.');

        setLoading(true);
        setMessage('');

        try {
            const { ok, data } = await post('verify-otp', { email, code });

            if (!ok) {
                setMessage(data.message || 'Verification failed');
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate(data.user.role === 'manager' ? '/manager' : '/student');
        } catch {
            setMessage('Unable to connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    const change = (i, v) => {
        const d = v.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[i] = d;
        setDigits(next);

        if (d && i < 5) refs.current[i + 1]?.focus();
        if (next.every(Boolean)) verify(next);
    };

    const paste = (e) => {
        const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!t) return;
        e.preventDefault();

        const next = Array.from({ length: 6 }, (_, k) => t[k] || '');
        setDigits(next);
        if (t.length === 6) verify(next);
    };

    const resend = async () => {
        setMessage('');
        const { ok, data } = await post('resend-otp', { email });
        if (!ok) return setMessage(data.message || 'Could not resend');

        setDigits(Array(6).fill(''));
        setCooldown(30);
        refs.current[0]?.focus();
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">WashTrack</div>

                <h1>Check your inbox</h1>

                <p className="auth-subtitle">
                    We sent a 6-digit code to <strong>{email}</strong>.
                    It expires in 10 minutes.
                </p>

                <div className="otp-row" onPaste={paste}>
                    {digits.map((d, i) => (
                        <input
                            key={i}
                            ref={(el) => (refs.current[i] = el)}
                            className="otp-box"
                            inputMode="numeric"
                            autoComplete={i === 0 ? 'one-time-code' : 'off'}
                            maxLength={1}
                            value={d}
                            onChange={(e) => change(i, e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !digits[i] && i > 0)
                                    refs.current[i - 1]?.focus();
                                if (e.key === 'Enter') verify();
                            }}
                        />
                    ))}
                </div>

                {message && <div className="auth-error">{message}</div>}

                <button
                    className="auth-button"
                    onClick={() => verify()}
                    disabled={loading}
                >
                    {loading ? 'Checking...' : 'Verify and continue'}
                </button>

                <p className="auth-footer">
                    Didn't get it?{' '}
                    <button
                        className="link-button"
                        onClick={resend}
                        disabled={cooldown > 0}
                    >
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                    </button>
                    <br />
                    <Link to="/signup">Use a different email</Link>
                </p>
            </div>
        </div>
    );
}

export default Verify;