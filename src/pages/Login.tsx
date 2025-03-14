import AuthForm from '../components/AuthForm';

interface LoginPageProps {
    onLogin: (authData: { serverUrl: string; token: string; userId: string; username: string }) => void;
}

const Login = ({ onLogin }: LoginPageProps) => (
    <div className="login">
        <div className="login_header">
            <div className="logo"></div>
        </div>
        <AuthForm onLogin={onLogin} />
        <div className="disclaimer">Jellyfin Music App - Version 0.1</div>
    </div>
);

export default Login;
