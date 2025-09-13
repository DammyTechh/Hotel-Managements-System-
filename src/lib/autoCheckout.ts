import { supabase } from './supabase';

export async function checkAndUpdateRoomStatus() {
  try {
    const now = new Date().toISOString();

    const { data: expiredBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, room_id')
      .eq('status', 'active')
      .lte('check_out', now);

    if (bookingsError) throw bookingsError;

    if (expiredBookings && expiredBookings.length > 0) {
      // Update booking status to completed
      const { error: updateBookingError } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .in('id', expiredBookings.map(booking => booking.id));

      if (updateBookingError) throw updateBookingError;

      // Update room status to available
      const { error: updateRoomError } = await supabase
        .from('rooms')
        .update({ status: 'available' })
        .in('id', expiredBookings.map(booking => booking.room_id));

      if (updateRoomError) throw updateRoomError;
    }
  } catch (error) {
    console.error('Error in auto-checkout system:', error);
  }
}