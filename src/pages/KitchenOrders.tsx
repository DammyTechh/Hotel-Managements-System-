import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Clock, ChefHat, CheckCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import KitchenOrderPrint from '../components/KitchenOrderPrint';

interface Booking {
  id: string;
  guest_id: string;
  room_id: string;
  payment_status: 'paid' | 'unpaid';
  guests: {
    full_name: string;
  };
  rooms: {
    room_number: string;
  };
}

interface KitchenOrder {
  id: string;
  booking_id: string | null;
  room_number: string | null;
  guest_name: string;
  food_name: string;
  price: number;
  quantity: number;
  total_amount: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed';
  notes: string | null;
  billing_type: 'room_bill' | 'separate';
  created_at: string;
  bookings?: {
    guests: {
      full_name: string;
    };
    rooms: {
      room_number: string;
    };
  };
}

export default function KitchenOrders() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
  });
  
  const kitchenPrintRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    booking_id: '',
    guest_name: '',
    food_name: '',
    price: '',
    quantity: 1,
    notes: '',
  });

  const handlePrintKitchen = useReactToPrint({
    content: () => kitchenPrintRef.current,
  });

  useEffect(() => {
    fetchOrders();
    fetchActiveBookings();
  }, []);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('kitchen_orders')
        .select(`
          *,
          bookings (
            guests (full_name),
            rooms (room_number)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast.error('Error fetching kitchen orders');
    } finally {
      setLoading(false);
    }
  }

  async function fetchActiveBookings() {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          guest_id,
          room_id,
          payment_status,
          guests (full_name),
          rooms (room_number)
        `)
        .eq('status', 'active');

      if (error) throw error;
      setActiveBookings(data || []);
    } catch (error) {
      console.error('Error fetching active bookings:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      // Get selected booking details
      const selectedBooking = activeBookings.find(b => b.id === formData.booking_id);
      let billingType: 'room_bill' | 'separate' = 'separate';
      let roomNumber = '';
      let guestName = formData.guest_name;

      if (selectedBooking) {
        billingType = selectedBooking.payment_status === 'unpaid' ? 'room_bill' : 'separate';
        roomNumber = selectedBooking.rooms.room_number;
        guestName = selectedBooking.guests.full_name;
      }

      const orderData = {
        booking_id: formData.booking_id || null,
        room_number: roomNumber || null,
        guest_name: guestName,
        food_name: formData.food_name,
        price: Number(formData.price),
        quantity: formData.quantity,
        notes: formData.notes,
        billing_type: billingType,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('kitchen_orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      // Print to kitchen
      if (kitchenPrintRef.current) {
        handlePrintKitchen();
      }

      toast.success('Kitchen order created and sent to printer');
      setIsModalOpen(false);
      setFormData({
        booking_id: '',
        guest_name: '',
        food_name: '',
        price: '',
        quantity: 1,
        notes: '',
      });
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || 'Error creating kitchen order');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: KitchenOrder['status']) => {
    try {
      const { error } = await supabase
        .from('kitchen_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      toast.error('Error updating order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch = (
      order.guest_name.toLowerCase().includes(searchString) ||
      order.food_name.toLowerCase().includes(searchString) ||
      order.room_number?.toLowerCase().includes(searchString)
    );
    
    const matchesStatus = !filters.status || order.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Kitchen Orders</h1>
        <button
          onClick={() => {
            setFormData({
              booking_id: '',
              guest_name: '',
              food_name: '',
              price: '',
              quantity: 1,
              notes: '',
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Kitchen Order
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
                placeholder="Search orders..."
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
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest & Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Food Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
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
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No kitchen orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.guest_name}
                        {order.room_number && (
                          <>
                            <br />
                            <span className="text-gray-500">
                              Room {order.room_number}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.food_name}
                        {order.notes && (
                          <>
                            <br />
                            <span className="text-gray-500 text-xs">
                              Note: {order.notes}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₦{order.total_amount.toLocaleString()}
                      <br />
                      <span className="text-xs text-gray-400">
                        {order.billing_type === 'room_bill' ? 'Room Bill' : 'Separate'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Start Preparing"
                          >
                            <ChefHat className="h-4 w-4" />
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Ready"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="text-purple-600 hover:text-purple-900"
                            title="Mark as Delivered"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            className="text-gray-600 hover:text-gray-900"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Kitchen Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">New Kitchen Order</h2>
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
                  Guest (Room Service)
                </label>
                <select
                  value={formData.booking_id}
                  onChange={(e) => {
                    const bookingId = e.target.value;
                    setFormData({ ...formData, booking_id: bookingId });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a guest (or leave empty for walk-in)</option>
                  {activeBookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      Room {booking.rooms.room_number} - {booking.guests.full_name}
                      {booking.payment_status === 'unpaid' ? ' (Unpaid)' : ' (Paid)'}
                    </option>
                  ))}
                </select>
              </div>

              {!formData.booking_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.guest_name}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Food Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.food_name}
                  onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price (₦)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

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
                  Create Order & Print
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Kitchen Print Component */}
      <div style={{ display: 'none' }}>
        <div ref={kitchenPrintRef}>
          <KitchenOrderPrint 
            order={{
              id: 'NEW-ORDER',
              created_at: new Date().toISOString(),
              order_type: 'kitchen',
              guest_name: formData.guest_name,
              food_name: formData.food_name,
              quantity: formData.quantity,
              notes: formData.notes,
              room_number: activeBookings.find(b => b.id === formData.booking_id)?.rooms.room_number
            }}
          />
        </div>
      </div>
    </div>
  );
}