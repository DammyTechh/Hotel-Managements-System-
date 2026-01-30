import React from 'react';
import { format } from 'date-fns';

interface BarOrderPrintProps {
  order: {
    id: string;
    created_at: string;
    guest_name: string;
    guest_type: 'lodged' | 'walk_in';
    drink_name: string;
    quantity: number;
    notes?: string;
    room_number?: string;
  };
}

const BarOrderPrint = React.forwardRef<HTMLDivElement, BarOrderPrintProps>(
  ({ order }, ref) => {
    return (
      <div ref={ref} className="pos-receipt bg-white text-black">
        <div className="print-only">

          {/* HEADER */}
          <div className="text-center mb-3">
            <h1 className="font-bold text-lg">MIYAKY HOTEL & SUITES</h1>
            <p className="text-sm">BAR ORDER RECEIPT</p>
            <p className="text-xs mt-1">
              {format(new Date(order.created_at), 'dd MMM yyyy HH:mm')}
            </p>
          </div>

          <hr />

          {/* CUSTOMER INFO */}
          <div className="text-sm my-2">
            <p><strong>Order ID:</strong> {order.id}</p>
            <p><strong>Customer:</strong> {order.guest_name}</p>
            <p>
              <strong>Type:</strong>{' '}
              {order.guest_type === 'lodged' ? 'Lodged Guest' : 'Walk-in'}
            </p>
            {order.room_number && (
              <p><strong>Room:</strong> {order.room_number}</p>
            )}
          </div>

          <hr />

          {/* ORDER DETAILS */}
          <div className="text-sm my-3">
            <p className="font-bold">ITEM</p>
            <p>
              {order.quantity} x {order.drink_name}
            </p>

            {order.notes && (
              <p className="text-xs mt-1">
                Note: {order.notes}
              </p>
            )}
          </div>

          <hr />

          {/* FOOTER */}
          <div className="text-center text-xs mt-3">
            <p>Printed:</p>
            <p>{format(new Date(), 'dd MMM yyyy HH:mm:ss')}</p>
            <p className="mt-2">Thank you</p>
          </div>

        </div>
      </div>
    );
  }
);

BarOrderPrint.displayName = 'BarOrderPrint';

export default BarOrderPrint;
