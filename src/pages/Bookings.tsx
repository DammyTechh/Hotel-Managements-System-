import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Search, Filter, X, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import BookingReceipt from '../components/BookingReceipt';

interface Booking {
  id: string;
  room_id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  rooms: {
    room_number: string;
    rate: number;
  };
  guests: {
    full_name: string;
    phone: string;
  };
}

interface Room {
  id: string;
  room_number: string;
  type: string;
  rate: number;
  status: string;
}

interface Guest {
  id: string;
  full_name: string;
  phone: string;
}

const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
  });
  const [selectedBookingForPrint, setSelectedBookingForPrint] = useState<Booking | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    room_id: '',
    guest_id: '',
    check_in: '',
    check_out: '',
    status: 'active',
  });

  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
  });

  useEffect(() => {
    fetchBookings();
    fetchRooms();
    fetchGuests();
  }, []);

  useEffect(() => {
    if (selectedBookingForPrint) {
      handlePrint();
      setSelectedBookingForPrint(null);
    }
  }, [selectedBookingForPrint, handlePrint]);

  async function fetchBookings() {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms (room_number, rate),
          guests (full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      toast.error('Error fetching bookings');
    } finally {
      setLoading(false);
    }
  }

  async function fetchRooms() {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'available');
      
      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }

  async function fetchGuests() {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('id, full_name, phone');
      
      if (error) throw error;
      setGuests(data || []);
    } catch (error) {
      console.error('Error fetching guests:', error);
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.guests.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.rooms.room_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || booking.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  const calculateTotalAmount = (roomId: string, checkIn: string, checkOut: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return 0;
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return room.rate * nights;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalAmount = calculateTotalAmount(
        formData.room_id,
        formData.check_in,
        formData.check_out
      );

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Verify staff record exists
      const { data: staffRecord, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('id', user.id)
        .single();

      if (staffError || !staffRecord) {
        throw new Error('Staff record not found. Please contact administrator.');
      }

      const bookingData = {
        ...formData,
        total_amount: totalAmount,
        created_by: user.id
      };

      if (selectedBooking) {
        const { error } = await supabase
          .from('bookings')
          .update(bookingData)
          .eq('id', selectedBooking.id);
        if (error) throw error;
        toast.success('Booking updated successfully');
      } else {
        const { error } = await supabase
          .from('bookings')
          .insert([bookingData]);
        if (error) throw error;
        toast.success('Booking added successfully');
      }

      // Update room status
      await supabase
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('id', formData.room_id);

      setIsModalOpen(false);
      setSelectedBooking(null);
      setFormData({
        room_id: '',
        guest_id: '',
        check_in: '',
        check_out: '',
        status: 'active',
      });
      fetchBookings();
      fetchRooms();
    } catch (error: any) {
      console.error('Error saving booking:', error);
      toast.error(error.message || 'Error saving booking. Please try again.');
    }
  };

  const openEditModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setFormData({
      room_id: booking.room_id,
      guest_id: booking.guest_id,
      check_in: booking.check_in.split('T')[0],
      check_out: booking.check_out.split('T')[0],
      status: booking.status,
    });
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Bookings Management</h1>
        <button
          onClick={() => {
            setSelectedBooking(null);
            setFormData({
              room_id: '',
              guest_id: '',
              check_in: '',
              check_out: '',
              status: 'active',
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white shadow rounded-lg">
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
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.guests.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Room {booking.rooms.room_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(booking.check_in), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₦{booking.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => openEditModal(booking)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBookingForPrint(booking);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Printer className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedBooking ? 'Edit Booking' : 'New Booking'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Guest
                </label>
                <select
                  required
                  value={formData.guest_id}
                  onChange={(e) => setFormData({ ...formData, guest_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a guest</option>
                  {guests.map((guest) => (
                    <option key={guest.id} value={guest.id}>
                      {guest.full_name} ({guest.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Room
                </label>
                <select
                  required
                  value={formData.room_id}
                  onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.room_number} - {room.type.charAt(0).toUpperCase() + room.type.slice(1)} (₦{room.rate.toLocaleString()}/night)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Check In Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.check_in}
                  onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Check Out Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.check_out}
                  onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {selectedBooking && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'completed' | 'cancelled' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {selectedBooking ? 'Update Booking' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt */}
      {selectedBookingForPrint && (
        <div style={{ display: 'none' }}>
          <div ref={printComponentRef}>
            <BookingReceipt booking={selectedBookingForPrint} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;