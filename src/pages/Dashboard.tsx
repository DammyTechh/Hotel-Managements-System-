import React, { useEffect, useState } from 'react';
import { BedDouble, Users, Calendar, Banknote } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  totalGuests: number;
  activeBookings: number;
  recentBookings: any[];
  totalRevenue: number;
  averageBookingValue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    occupiedRooms: 0,
    totalGuests: 0,
    activeBookings: 0,
    recentBookings: [],
    totalRevenue: 0,
    averageBookingValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Fetch total rooms and occupied rooms
        const { data: rooms } = await supabase
          .from('rooms')
          .select('status');
        
        const totalRooms = rooms?.length || 0;
        const occupiedRooms = rooms?.filter(room => room.status === 'occupied').length || 0;

        // Fetch total guests
        const { count: totalGuests } = await supabase
          .from('guests')
          .select('*', { count: 'exact' });

        // Fetch active bookings
        const { data: activeBookings } = await supabase
          .from('bookings')
          .select('*')
          .eq('status', 'active');

        // Fetch recent bookings with guest and room details
        const { data: recentBookings } = await supabase
          .from('bookings')
          .select(`
            *,
            guests (full_name),
            rooms (room_number)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          totalRooms,
          occupiedRooms,
          totalGuests: totalGuests || 0,
          activeBookings: activeBookings?.length || 0,
          recentBookings: recentBookings || [],
          totalRevenue: 0,
          averageBookingValue: 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const stats_cards = [
    {
      title: 'Total Rooms',
      value: stats.totalRooms,
      subtext: `${stats.occupiedRooms} occupied`,
      icon: BedDouble,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Guests',
      value: stats.totalGuests,
      subtext: 'registered guests',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Active Bookings',
      value: stats.activeBookings,
      subtext: 'current stays',
      icon: Calendar,
      color: 'bg-purple-500',
    },
    {
      title: 'Occupancy Rate',
      value: stats.totalRooms ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0,
      subtext: 'of rooms occupied',
      icon: Banknote,
      color: 'bg-orange-500',
      suffix: '%',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats_cards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
            >
              <dt>
                <div className={`absolute rounded-md p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">
                  {stat.title}
                </p>
              </dt>
              <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                  {stat.suffix}
                </p>
                <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm text-gray-500">{stat.subtext}</div>
                </div>
              </dd>
            </div>
          );
        })}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Recent Bookings</h2>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.guests.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Room {booking.rooms.room_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(booking.check_in).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(booking.check_out).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'completed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}