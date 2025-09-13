import React from 'react';
import { format } from 'date-fns';

interface BarReceiptProps {
  order: {
    id: string;
    created_at: string;
    guest_name: string;
    guest_type: 'lodged' | 'walk_in';
    drink_name: string;
    unit_price: number;
    quantity: number;
    total_amount: number;
    notes?: string;
  };
}

const BarReceipt = React.forwardRef<HTMLDivElement, BarReceiptProps>(
  ({ order }, ref) => {
    const tax = order.total_amount * 0.075; // 7.5% VAT
    const totalWithTax = order.total_amount + tax;

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
              <p className="text-gray-600 text-lg mt-2">Bar Receipt</p>
            </div>
          </div>

          {/* Order Details */}
          <div className="border-2 border-gray-200 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-600 text-sm">Receipt ID:</p>
                <p className="text-lg font-medium">{order.id}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Date:</p>
                <p className="text-lg font-medium">
                  {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Customer:</p>
                <p className="text-lg font-medium">{order.guest_name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Type:</p>
                <p className="text-lg font-medium">
                  {order.guest_type === 'lodged' ? 'Lodged Guest' : 'Walk-in Customer'}
                </p>
              </div>
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
                  <tr>
                    <td className="py-4">
                      <div>
                        <p className="font-medium">{order.drink_name}</p>
                        {order.notes && (
                          <p className="text-sm text-gray-500">{order.notes}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4">{order.quantity}</td>
                    <td className="py-4">₦{order.unit_price.toLocaleString()}</td>
                    <td className="py-4 text-right">
                      ₦{order.total_amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-gray-600">Subtotal:</p>
                  <p className="font-medium">₦{order.total_amount.toLocaleString()}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">VAT (7.5%):</p>
                  <p className="font-medium">₦{tax.toLocaleString()}</p>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                  <p>Total:</p>
                  <p>₦{totalWithTax.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-gray-600 font-medium">Thank you for your patronage!</p>
            <div className="mt-4 border-4 border-green-500 inline-block px-8 py-2 rounded-lg">
              <p className="text-2xl font-bold text-green-500">PAID</p>
            </div>
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

BarReceipt.displayName = 'BarReceipt';

export default BarReceipt;