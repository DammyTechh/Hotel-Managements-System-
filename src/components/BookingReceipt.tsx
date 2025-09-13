import React from 'react';
import { format } from 'date-fns';

interface BookingReceiptProps {
  booking: {
    guests: {
      full_name: string;
    };
    rooms: {
      room_number: string;
    };
    check_in: string;
    check_out: string;
    status: string;
    total_amount: number;
  };
}

const BookingReceipt = React.forwardRef<HTMLDivElement, BookingReceiptProps>(
  ({ booking }, ref) => {
    return (
      <div ref={ref} className="p-8 bg-white">
        {/* Only visible when printing */}
        <div className="print-only">
          {/* Logo and Header */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-48 h-48 mb-4 overflow-hidden rounded-2xl border-4 border-blue-900 shadow-lg">
              <img
                src="https://imgur.com/a5YN48Z.jpg"
                alt="MIYAKY HOTEL AND SUITES"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-blue-900">MIYAKY HOTEL AND SUITES</h1>
              <p className="text-gray-600 text-lg mt-2">Official Booking Receipt</p>
            </div>
          </div>

          {/* Receipt Details */}
          <div className="border-2 border-gray-200 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">Guest Name:</p>
                <p className="text-xl font-semibold text-gray-900">{booking.guests.full_name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">Room Number:</p>
                <p className="text-xl font-semibold text-gray-900">{booking.rooms.room_number}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">Check-in:</p>
                <p className="text-lg font-medium text-gray-900">
                  {format(new Date(booking.check_in), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">Check-out:</p>
                <p className="text-lg font-medium text-gray-900">
                  {format(new Date(booking.check_out), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">Status:</p>
                <p className="text-lg font-medium capitalize text-gray-900">{booking.status}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">Amount:</p>
                <p className="text-xl font-bold text-blue-900">₦{booking.total_amount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center border-t-2 border-gray-200 pt-6">
            <p className="text-gray-600 font-medium">Thank you for choosing MIYAKY HOTEL AND SUITES</p>
            <div className="mt-4 text-sm text-gray-500 space-y-1">
              <p>For inquiries, please contact our front desk</p>
              <p>This is an official receipt. Please keep it for your records.</p>
              <p>Receipt generated on: {format(new Date(), 'MMMM dd, yyyy HH:mm')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

BookingReceipt.displayName = 'BookingReceipt';

export default BookingReceipt;