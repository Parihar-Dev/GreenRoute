import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function MainLayout() {
    return (
        <div>
            <Navbar />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;