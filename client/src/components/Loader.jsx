import Logo from '../assets/Logo.png';

function Loader () {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-black">
      <img src={Logo} alt="GreenRoute Logo" className="w-32 h-auto mb-8" />
      <div className="w-12 h-12 border-4 border-gray-700 border-t-green-500 rounded-full animate-spin"></div>
    </div>
  );
};

export default Loader;