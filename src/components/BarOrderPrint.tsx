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
      <div ref={ref} className="p-4 bg-white text-xl">
        <div className="print-only">
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-4 mb-4">
            <h1 className="text-4xl font-bold">BAR ORDER</h1>
            <p className="text-2xl mt-2">
              {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>

          {/* Order Info */}
          <div className="mb-6 text-2xl">
            <p>
              <strong>Order ID:</strong> {order.id}
            </p>
            <p>
              <strong>Customer:</strong> {order.guest_name}
            </p>
            <p>
              <strong>Type:</strong> {order.guest_type === 'lodged' ? 'Lodged Guest' : 'Walk-in Customer'}
            </p>
            {order.room_number && (
              <p>
                <strong>Room:</strong> {order.room_number}
              </p>
            )}
          </div>

          {/* Drink Order */}
          <div className="border-t-2 border-b-2 border-black py-4 mb-4">
            <h2 className="text-3xl font-bold mb-4">DRINK ORDER</h2>
            <div className="text-2xl">
              <p className="font-bold">
                {order.quantity}x {order.drink_name}
              </p>
              {order.notes && (
                <p className="ml-4 text-xl">Note: {order.notes}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xl">
              Printed: {format(new Date(), 'MMM dd, yyyy HH:mm:ss')}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

BarOrderPrint.displayName = 'BarOrderPrint';

export default BarOrderPrint;