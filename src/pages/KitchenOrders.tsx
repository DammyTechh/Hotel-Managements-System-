import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import KitchenOrderPrint from '../components/KitchenOrderPrint';

interface Booking {
  id: string;
  payment_status: 'paid' | 'unpaid';
  guests: { full_name: string };
  rooms: { room_number: string };
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  kitchen_categories: { name: string };
}

interface Waiter {
  id: string;
  name: string;
}

interface Order {
  id: string;
  guest_name: string;
  food_name: string;
  quantity: number;
  total_amount: number;
  status: string;
  order_source: string;
  paid: boolean;
  created_at: string;
}

export default function KitchenOrders() {

  const printRef = useRef<HTMLDivElement>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);

  const [mode, setMode] = useState<'room' | 'pos'>('room');

  const [form, setForm] = useState({
    booking_id: '',
    menu_id: '',
    food_name: '',
    price: '',
    quantity: 1,
    notes: '',
    waiter_id: ''
  });

  const handlePrint = useReactToPrint({
    content: () => printRef.current
  });

  /* ---------------- FETCHERS ---------------- */

  useEffect(() => {
    fetchAll();
    subscribeRealtime();
  }, []);

  async function fetchAll() {
    await Promise.all([
      fetchOrders(),
      fetchMenu(),
      fetchBookings(),
      fetchWaiters()
    ]);
    setLoading(false);
  }

  async function fetchOrders() {
    const { data } = await supabase
      .from('kitchen_orders')
      .select('*')
      .order('created_at', { ascending: false });

    setOrders(data || []);
  }

  async function fetchMenu() {
    const { data } = await supabase
      .from('kitchen_menu')
      .select(`id,name,price,kitchen_categories(name)`)
      .eq('is_available', true)
      .order('name');

    setMenuItems(data || []);
  }

  async function fetchBookings() {
    const { data } = await supabase
      .from('bookings')
      .select(`id,payment_status,guests(full_name),rooms(room_number)`)
      .eq('status', 'active');

    setBookings(data || []);
  }

  async function fetchWaiters() {
    const { data } = await supabase
      .from('waiters')
      .select('*')
      .eq('is_active', true);

    setWaiters(data || []);
  }

  function subscribeRealtime() {
    supabase.channel('kitchen-live')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'kitchen_orders' },
        fetchOrders
      )
      .subscribe();
  }

  /* ---------------- MENU SELECT ---------------- */

  function selectMenu(id: string) {
    const item = menuItems.find(m => m.id === id);
    if (!item) return;

    setForm(f => ({
      ...f,
      menu_id: id,
      food_name: item.name,
      price: String(item.price)
    }));
  }

  /* ---------------- CREATE ORDER ---------------- */

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();

    if (!form.menu_id) return toast.error('Select menu');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error('Login required');

    const splitId = crypto.randomUUID();

    const booking = bookings.find(b => b.id === form.booking_id);

    let billing_type: 'room_bill' | 'separate' = 'separate';
    let guest_name = 'Walk-In';
    let room_number = null;
    let paid = false;

    if (mode === 'room' && booking) {
      guest_name = booking.guests.full_name;
      room_number = booking.rooms.room_number;
      billing_type = booking.payment_status === 'unpaid' ? 'room_bill' : 'separate';
    }

    if (mode === 'pos') {
      paid = true;
    }

    const { error } = await supabase.from('kitchen_orders').insert([{
      booking_id: mode === 'room' ? form.booking_id : null,
      room_number,
      guest_name,
      food_name: form.food_name,
      price: Number(form.price),
      quantity: form.quantity,
      notes: form.notes,
      billing_type,
      waiter_id: form.waiter_id || null,
      order_source: mode === 'pos' ? 'pos' : 'room',
      split_group_id: splitId,
      created_by: user.id,
      paid
    }]);

    if (error) return toast.error(error.message);

    toast.success('Order created');
    handlePrint();
    setModal(false);
    resetForm();
  }

  function resetForm() {
    setForm({
      booking_id: '',
      menu_id: '',
      food_name: '',
      price: '',
      quantity: 1,
      notes: '',
      waiter_id: ''
    });
  }

  /* ---------------- STATUS UPDATE ---------------- */

  async function updateStatus(id: string, status: string) {
    await supabase.from('kitchen_orders')
      .update({ status })
      .eq('id', id);
  }

  /* ---------------- FILTER ---------------- */

  const filtered = orders.filter(o =>
    o.guest_name.toLowerCase().includes(search.toLowerCase()) ||
    o.food_name.toLowerCase().includes(search.toLowerCase())
  );

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6">

      <div className="flex gap-3">
        <button
          onClick={() => setModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded">
          <Plus className="inline mr-2 h-4 w-4" />
          New Order
        </button>

        <input
          placeholder="Search orders"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {/* TABLE */}

      <div className="bg-white shadow rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Food</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Source</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id}>
                <td>{o.guest_name}</td>
                <td>{o.food_name}</td>
                <td>{o.quantity}</td>
                <td>₦{o.total_amount}</td>
                <td>{o.order_source}</td>
                <td>
                  <select
                    value={o.status}
                    onChange={e => updateStatus(o.id, e.target.value)}
                  >
                    <option>pending</option>
                    <option>preparing</option>
                    <option>ready</option>
                    <option>delivered</option>
                    <option>completed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <form
            onSubmit={createOrder}
            className="bg-white p-6 rounded w-full max-w-md space-y-4">

            {/* MODE SWITCH */}
            <div className="flex gap-3">
              <button type="button"
                onClick={() => setMode('room')}
                className={`px-3 py-1 rounded ${mode === 'room' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                Room
              </button>

              <button type="button"
                onClick={() => setMode('pos')}
                className={`px-3 py-1 rounded ${mode === 'pos' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                POS Walk-In
              </button>
            </div>

            {/* BOOKING SELECT */}
            {mode === 'room' && (
              <select
                required
                value={form.booking_id}
                onChange={e => setForm({ ...form, booking_id: e.target.value })}
                className="border p-2 rounded w-full"
              >
                <option value="">Select Room Guest</option>
                {bookings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.rooms.room_number} — {b.guests.full_name}
                  </option>
                ))}
              </select>
            )}

            {/* MENU */}
            <select
              required
              value={form.menu_id}
              onChange={e => selectMenu(e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="">Menu Item</option>
              {menuItems.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} — ₦{m.price}
                </option>
              ))}
            </select>

            {/* WAITER */}
            <select
              value={form.waiter_id}
              onChange={e => setForm({ ...form, waiter_id: e.target.value })}
              className="border p-2 rounded w-full"
            >
              <option value="">Select Waiter</option>
              {waiters.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>

            <input value={form.price} readOnly className="border p-2 rounded bg-gray-100" />

            <input
              type="number"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: +e.target.value })}
              className="border p-2 rounded"
            />

            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="border p-2 rounded"
            />

            <div className="flex justify-between">
              <button className="bg-blue-600 text-white px-4 py-2 rounded">
                Create
              </button>

              <button type="button"
                onClick={() => setModal(false)}>
                <X />
              </button>
            </div>

          </form>
        </div>
      )}

      {/* PRINT */}

      <div style={{ display: 'none' }} ref={printRef}>
        <KitchenOrderPrint order={{
          guest_name: form.food_name,
          food_name: form.food_name,
          quantity: form.quantity,
          created_at: new Date().toISOString()
        }} />
      </div>

    </div>
  );
}
