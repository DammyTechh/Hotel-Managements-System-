import React from 'react';
import { format } from 'date-fns';

interface OrderReceiptProps {
  order: {
    id: string;
    created_at: string;
    order_type: string;
    table_number?: string;
    bookings?: {
      guests: {
        full_name: string;
      };
      rooms: {
        room_number: string;
      };
    };
    order_items: Array<{
      quantity: number;
      unit_price: number;
      notes?: string;
      menu_items: {
        name: string;
      };
    }>;
  };
  showPaid?: boolean;
}

const OrderReceipt = React.forwardRef<HTMLDivElement, OrderReceiptProps>(
  ({ order, showPaid = true }, ref) => {
    const subtotal = order.order_items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const tax = subtotal * 0.075;
    const total = subtotal + tax;

    return (
      <div ref={ref} className="print-only font-mono bg-white px-2 py-2">
        {/* Header */}
        <div className="text-center mb-2">
          <img
            src="https://imgur.com/a5YN48Z.jpg"
            alt="Hotel Logo"
            className="mx-auto w-20 h-20 object-cover"
          />
          <h1 className="font-bold text-sm mt-1">MIYAKY HOTEL & SUITES</h1>
          <p className="text-xs">Order Receipt</p>
        </div>

        <hr className="border-dashed my-2" />

        {/* Order Info */}
        <div className="text-xs space-y-1">
          <p><strong>ID:</strong> {order.id.slice(0, 8)}</p>
          <p>
            <strong>Date:</strong>{' '}
            {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
          </p>
          <p>
            <strong>Type:</strong>{' '}
            {order.order_type.replace('_', ' ')}
          </p>
          <p>
            <strong>
              {order.bookings ? 'Room' : 'Table'}:
            </strong>{' '}
            {order.bookings
              ? order.bookings.rooms.room_number
              : order.table_number}
          </p>

          {order.bookings && (
            <p>
              <strong>Guest:</strong>{' '}
              {order.bookings.guests.full_name}
            </p>
          )}
        </div>

        <hr className="border-dashed my-2" />

        {/* Items */}
        <table className="text-xs w-full">
          <thead>
            <tr>
              <th align="left">Item</th>
              <th align="center">Qty</th>
              <th align="right">Amt</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item, i) => (
              <tr key={i}>
                <td>
                  {item.menu_items.name}
                  {item.notes && (
                    <div className="text-[10px] italic">
                      ({item.notes})
                    </div>
                  )}
                </td>
                <td align="center">{item.quantity}</td>
                <td align="right">
                  ₦{(item.quantity * item.unit_price).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="border-dashed my-2" />

        {/* Totals */}
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT (7.5%)</span>
            <span>₦{tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
        </div>

        <hr className="border-dashed my-2" />

        {/* Footer */}
        <div className="text-center text-xs">
          {showPaid && (
            <p className="font-bold mt-1">*** PAID ***</p>
          )}
          <p className="mt-1">Thank you for your patronage</p>
          <p className="text-[10px]">
            {format(new Date(), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
      </div>
    );
  }
);

OrderReceipt.displayName = 'OrderReceipt';
export default OrderReceipt;
