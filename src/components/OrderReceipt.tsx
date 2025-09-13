import React from 'react';
import { format } from 'date-fns';

interface OrderReceiptProps {
  order: {
    id: string;
    created_at: string;
    total_amount: number;
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
    const subtotal = order.order_items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0
    );
    const tax = subtotal * 0.075; // 7.5% VAT
    const total = subtotal + tax;

    return (
      <div ref={ref} className="p-8 bg-white">
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
              <p className="text-gray-600 text-lg mt-2">Order Receipt</p>
            </div>
          </div>

          {/* Order Details */}
          <div className="border-2 border-gray-200 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-600 text-sm">Order ID:</p>
                <p className="text-lg font-medium">{order.id}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Date:</p>
                <p className="text-lg font-medium">
                  {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Order Type:</p>
                <p className="text-lg font-medium capitalize">
                  {order.order_type.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">
                  {order.bookings ? 'Room' : 'Table'}:
                </p>
                <p className="text-lg font-medium">
                  {order.bookings 
                    ? `Room ${order.bookings.rooms.room_number}`
                    : `Table ${order.table_number}`
                  }
                </p>
              </div>
              {order.bookings && (
                <div className="col-span-2">
                  <p className="text-gray-600 text-sm">Guest:</p>
                  <p className="text-lg font-medium">{order.bookings.guests.full_name}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="border-t border-gray-200 pt-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="pb-4">Item</th>
                    <th className="pb-4">Qty</th>
                    <th className="pb-4">Price</th>
                    <th className="pb-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="border-t border-gray-200">
                  {order.order_items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-4">
                        <div>
                          <p className="font-medium">{item.menu_items.name}</p>
                          {item.notes && (
                            <p className="text-sm text-gray-500">{item.notes}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4">{item.quantity}</td>
                      <td className="py-4">₦{item.unit_price.toLocaleString()}</td>
                      <td className="py-4 text-right">
                        ₦{(item.quantity * item.unit_price).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-gray-600">Subtotal:</p>
                  <p className="font-medium">₦{subtotal.toLocaleString()}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">VAT (7.5%):</p>
                  <p className="font-medium">₦{tax.toLocaleString()}</p>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                  <p>Total:</p>
                  <p>₦{total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-gray-600 font-medium">Thank you for dining with us!</p>
            {showPaid && (
              <div className="mt-4 border-4 border-green-500 inline-block px-8 py-2 rounded-lg">
                <p className="text-2xl font-bold text-green-500">PAID</p>
              </div>
            )}
            <div className="mt-4 text-sm text-gray-500 space-y-1">
              <p>For inquiries, please contact our front desk</p>
              <p>Receipt generated on: {format(new Date(), 'MMMM dd, yyyy HH:mm')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

OrderReceipt.displayName = 'OrderReceipt';

export default OrderReceipt;