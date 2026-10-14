import AuthForm from '../components/AuthForm';

function Login(props) {
  return <AuthForm {...props} page="login" />;
}

export default Login;