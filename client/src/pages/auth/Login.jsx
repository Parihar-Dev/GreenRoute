import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, checkAuth } from '../../features/authSlice';

function Login() {
    const dispatch = useDispatch();
    const { status:authStatus, error} = useSelector((state) => state.auth);
    const [ formData, setFormData ] = useState({
        email: '',
        password: ''
    });
    const [ showPassword, setShowPassword ] = useState(false);
    const [ message, setMessage ] = useState('');
    const { email, password } = formData;
    const onChange = (e) => setFormData({...formData, [e.target.id]: e.target.value});

    const onSubmit = async(e) => {
        e.preventDefault();
        dispatch(loginUser({ email, password}));
    };

    if (authStatus === 'loading') {
        return <p>Loading...</p>;
    }

    return (
        <div className='flex justify-center items-center min-h-[100vh] p-4 bg-slate-900'>
            
            <div className='max-w-md w-full p-8'>
                <h2 className='text-xl font-normal pb-4 text-white'>Login to your account</h2>
                <form onSubmit={onSubmit} className='space-y-5'>
                    <div>
                        <input 
                            id='email'
                            type='text'
                            placeholder='Enter your email'
                            value={formData.email}
                            onChange={onChange}
                            className='w-full px-4 py-2 font-light text-white placeholder-white border border-white rounded-md focus:outline-none focus:border-[#78E65A]'
                        />
                    </div>
                    <div className='relative'>
                        <input 
                            id='password'
                            type={showPassword ? 'text' : 'password'}
                            placeholder='Enter your password'
                            value={formData.password}
                            onChange={onChange}
                            className='w-full px-4 py-2 font-light text-white placeholder-white border border-white rounded-md focus:outline-none focus:border-[#78E65A]'
                        />
                        <span 
                            className='absolute inset-y-0 right-3 flex justify-center items-center text-white cursor-pointer'
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>
                    <button
                        type='submit'
                        className='bg-[#78E65A] px-8 py-2 font-normal rounded-md cursor-pointer'
                    >
                        Login
                    </button>
                </form>
                <div className='mt-4 font-light text-center text-white'>
                    Don't have an account ? <span> </span>
                    <Link
                        to='/register'
                        className='text-[#78E65A] cursor-pointer hover:text-green-300'
                    >
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Login;