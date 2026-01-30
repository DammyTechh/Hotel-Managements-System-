import React from "react";
import { format } from "date-fns";

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
      <div ref={ref} className="print-only">
        <div className="pos-receipt">
          <div className="center">
            <img
              src="https://imgur.com/a5YN48Z.jpg"
              alt="MIYAKY HOTEL"
              className="logo"
            />
            <h2>MIYAKY HOTEL & SUITES</h2>
            <p>Booking Receipt</p>
          </div>

          <hr />

          <div className="row">
            <span>Guest</span>
            <span>{booking.guests.full_name}</span>
          </div>

          <div className="row">
            <span>Room</span>
            <span>{booking.rooms.room_number}</span>
          </div>

          <div className="row">
            <span>Check-In</span>
            <span>
              {format(new Date(booking.check_in), "dd/MM/yyyy HH:mm")}
            </span>
          </div>

          <div className="row">
            <span>Check-Out</span>
            <span>
              {format(new Date(booking.check_out), "dd/MM/yyyy HH:mm")}
            </span>
          </div>

          <div className="row">
            <span>Status</span>
            <span>{booking.status}</span>
          </div>

          <hr />

          <div className="row bold">
            <span>Total</span>
            <span>₦{booking.total_amount.toLocaleString()}</span>
          </div>

          <hr />

          <div className="center small">
            <p>Thank you for your patronage</p>
            <p>
              {format(new Date(), "dd MMM yyyy HH:mm")}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

BookingReceipt.displayName = "BookingReceipt";
export default BookingReceipt;
