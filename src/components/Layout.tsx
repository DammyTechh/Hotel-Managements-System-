import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BedDouble, Users, Calendar, FileText, LogOut, Menu, Settings, ChefHat, Wine } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { path: '/', icon: BedDouble, label: 'Dashboard' },
    { path: '/rooms', icon: BedDouble, label: 'Rooms' },
    { path: '/guests', icon: Users, label: 'Guests' },
    { path: '/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/kitchen-orders', icon: ChefHat, label: 'Kitchen Orders' },
    { path: '/bar-orders', icon: Wine, label: 'Bar Orders' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-blue-900">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <img 
                src="https://imgur.com/a5YN48Z.jpg" 
                alt="MIYAKY HOTEL"
                className="h-12 w-12 rounded-xl object-cover border-2 border-white shadow-lg transform hover:scale-110 transition-all duration-300"
              />
              <span className="ml-3 text-xl font-bold text-white">MIYAKY HOTEL</span>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${
                      location.pathname === item.path
                        ? 'bg-blue-800 text-white scale-105'
                        : 'text-gray-300 hover:bg-blue-800 hover:text-white hover:scale-105'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out transform origin-left`}
                  >
                    <Icon className="mr-3 h-6 w-6 transition-transform duration-300 ease-in-out group-hover:rotate-6" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-shrink-0 bg-blue-800 p-4">
            <button
              onClick={handleSignOut}
              className="group flex w-full items-center text-sm font-medium text-gray-300 hover:text-white transition-all duration-300"
            >
              <LogOut className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:-translate-x-1" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden bg-blue-900 text-white">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center">
            <img 
              src="https://imgur.com/a5YN48Z.jpg" 
              alt="MIYAKY HOTEL"
              className="h-10 w-10 rounded-xl object-cover border-2 border-white shadow-lg"
            />
            <span className="ml-2 text-xl font-bold">MIYAKY HOTEL</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md hover:bg-blue-800 transition-colors duration-200"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <nav className="px-2 pt-2 pb-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${
                    location.pathname === item.path
                      ? 'bg-blue-800 text-white scale-105'
                      : 'text-gray-300 hover:bg-blue-800 hover:text-white hover:scale-105'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md transition-all duration-300 ease-in-out transform`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="mr-3 h-6 w-6 transition-transform duration-300 ease-in-out group-hover:rotate-6" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="w-full text-left text-gray-300 hover:bg-blue-800 hover:text-white group flex items-center px-2 py-2 text-base font-medium rounded-md transition-all duration-300"
            >
              <LogOut className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:-translate-x-1" />
              Sign out
            </button>
          </nav>
        )}
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}