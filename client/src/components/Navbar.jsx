import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Menu, X, User, LogOut, Car } from 'lucide-react';
import { logout } from '../features/authSlice';
import Logo from '../assets/Logo.png';

function Navbar() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const { token } = useSelector((state) => state.auth);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const body = document.body;
        if (isMobileMenuOpen || isDropdownOpen) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = 'auto';
        }
        return () => {
            body.style.overflow = 'auto';
        };
    }, [isMobileMenuOpen, isDropdownOpen]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);


    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const handleLogout = () => {
        dispatch(logout());
        setIsDropdownOpen(false);
        closeMobileMenu();
        navigate('/');
    };

    return (
        <>
            <div className='flex justify-center items-center'>
                <div className='bg-slate-950/50 border-b backdrop-blur-md border-slate-800 absolute top-0 w-full z-30'>
                    
                    <div className='max-w-7xl mx-auto flex justify-between items-center p-4 relative'>
                        <Link to='/'>
                            <img src={Logo} alt='GreenRoute Logo' className='h-6 cursor-pointer' />
                        </Link>

                        <div className='hidden md:flex items-center space-x-8 absolute left-1/2 -translate-x-1/2'>
                            <a href='#features' className='font-extralight text-white pb-1 border-b-2 border-transparent hover:border-[#78E65A] active:border-[#78E65A]'>Features</a>
                            <a href='#how-it-works' className='font-extralight text-white pb-1 border-b-2 border-transparent hover:border-[#78E65A] active:border-[#78E65A]'>How It Works</a>
                            <a href='#cta' className='font-extralight text-white pb-1 border-b-2 border-transparent hover:border-[#78E65A] active:border-[#78E65A]'>CTA</a>
                        </div>

                        <div className='hidden md:flex items-center space-x-4'>
                            {token ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="bg-slate-800/50 p-2 rounded-full text-white hover:bg-slate-700 cursor-pointer">
                                        <User size={20} />
                                    </button>
                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-[#1A364E] rounded-lg shadow-xl py-2 z-40 border border-slate-700">
                                            <Link to='/dashboard' className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">
                                                <User size={16} /> Dashboard
                                            </Link>
                                            <Link to='/garage' className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">
                                                <Car size={16} /> My Garage
                                            </Link>
                                            <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">
                                                <LogOut size={16} /> Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Link to='/register' className='font-light text-sm text-white border border-[#78E65A] rounded-full px-5 py-2'>Sign up</Link>
                                    <Link to='/login' className='font-light text-sm bg-[#78E65A] px-5 py-2 rounded-full hover:bg-green-500 transition-colors'>Login</Link>
                                </>
                            )}
                        </div>

                        <button className='md:hidden text-white cursor-pointer' onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            <Menu size={26} />
                        </button>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className='md:hidden fixed inset-0 z-50 bg-slate-50 text-slate-800 flex flex-col items-center justify-center'>
                        <button className='absolute top-4 right-4 text-slate-800 cursor-pointer' onClick={closeMobileMenu}>
                            <X size={26} />
                        </button>
                        
                        <div className="flex flex-col items-center space-y-8">
                            <a href="#features" className="text-3xl font-extralight" onClick={closeMobileMenu}>Features</a>
                            <a href="#how-it-works" className="text-3xl font-extralight" onClick={closeMobileMenu}>How It Works</a>
                            <a href="#cta" className="text-3xl font-extralight" onClick={closeMobileMenu}>CTA</a>
                        </div>

                        <div className="absolute bottom-10 flex flex-col w-full px-8 space-y-4">
                            {token ? (
                                <>
                                    <Link to='/garage' className='w-full text-center font-light text-lg text-slate-800 border border-[#1A364E] rounded-full py-3'>My Garage</Link>
                                    <button onClick={handleLogout} className='w-full text-center font-light text-lg bg-[#1A364E] text-white py-3 rounded-full'>Logout</button>
                                </>
                            ) : (
                                <>
                                    <Link to='/register' className='w-full text-center font-light text-lg text-slate-800 border border-[#1A364E] rounded-full py-3' onClick={closeMobileMenu}>Sign up</Link>
                                    <Link to='/login' className='w-full text-center font-light text-lg bg-[#1A364E] text-white py-3 rounded-full' onClick={closeMobileMenu}>Login</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Navbar;