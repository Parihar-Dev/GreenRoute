import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import api from '../../api/apiClient';

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [ showPassword, setShowPassword ] = useState(false);
    const [ message, setMessage ] = useState('');
    const { name, email, password } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.id]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/register', { name, email, password });
            setMessage(res.data.message);
            navigate('/login');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className='flex justify-center items-center min-h-[100vh] p-4 bg-slate-900'>
            <div className='max-w-md w-full p-8'>
                <h2 className='text-xl font-normal pb-4 text-white'>Create a new account</h2>
                <form onSubmit={onSubmit} className='space-y-5'>
                    <div>
                        <input
                            id='name'
                            type='text'
                            placeholder='Enter your username'
                            value={formData.name}
                            onChange={onChange}
                            className='w-full px-4 py-2 font-light placeholder-white text-white border border-white rounded-md focus:outline-none focus:border-[#78E65A]'
                        />
                    </div>
                    <div>
                        <input
                            id='email'
                            type='email'
                            placeholder='Enter your email'
                            value={formData.email}
                            onChange={onChange}
                            className='w-full px-4 py-2 font-light placeholder-white text-white border border-white rounded-md focus:outline-none focus:border-[#78E65A]'
                        />
                    </div>
                    <div className='relative'>
                        <input
                            id='password'
                            type={showPassword ? 'text' : 'password'}
                            placeholder='Enter your password'
                            value={formData.password}
                            onChange={onChange}
                            className='w-full px-4 py-2 pr-10 font-light placeholder-white text-white border border-white rounded-md focus:outline-none focus:border-[#78E65A]'
                        />
                        <span 
                            className='absolute inset-y-0 right-3 flex items-center cursor-pointer text-white'
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>
                    {message && (
                        <p className="mt-3 text-sm text-center text-red-400">{message}</p>
                    )}
                    <button
                        type='submit'
                        className='bg-[#78E65A] font-normal px-8 py-2 rounded-md cursor-pointer'
                    >
                        Sign up
                    </button>
                </form>
                <div className='mt-5 text-white font-light text-center'>
                    Already have an account ?<span> </span>
                    <Link
                        to="/login"
                        className='text-[#78E65A] cursor-pointer hover:text-green-300'
                    > 
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Register;