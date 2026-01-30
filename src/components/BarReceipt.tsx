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
    const vat = order.total_amount * 0.075;
    const grandTotal = order.total_amount + vat;

    return (
      <div ref={ref} className="pos-receipt bg-white text-black">
        <div className="print-only">

          {/* HEADER */}
          <div className="text-center mb-2">
            <h1 className="font-bold text-lg">MIYAKY HOTEL & SUITES</h1>
            <p className="text-sm">BAR RECEIPT</p>
            <p className="text-xs">
              {format(new Date(order.created_at), 'dd MMM yyyy HH:mm')}
            </p>
          </div>

          <hr />

          {/* CUSTOMER INFO */}
          <div className="text-sm my-2">
            <p><strong>Receipt:</strong> {order.id}</p>
            <p><strong>Customer:</strong> {order.guest_name}</p>
            <p>
              <strong>Type:</strong>{' '}
              {order.guest_type === 'lodged' ? 'Lodged Guest' : 'Walk-in'}
            </p>
          </div>

          <hr />

          {/* ITEM */}
          <div className="text-sm my-2">
            <p className="font-bold">ITEM</p>
            <p>{order.drink_name}</p>

            {order.notes && (
              <p className="text-xs">Note: {order.notes}</p>
            )}

            <div className="flex justify-between mt-1">
              <span>
                {order.quantity} x ₦{order.unit_price.toLocaleString()}
              </span>
              <span>
                ₦{order.total_amount.toLocaleString()}
              </span>
            </div>
          </div>

          <hr />

          {/* TOTALS */}
          <div className="text-sm my-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₦{order.total_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT (7.5%)</span>
              <span>₦{vat.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t mt-1 pt-1">
              <span>TOTAL</span>
              <span>₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <hr />

          {/* PAID */}
          <div className="text-center text-sm mt-2 font-bold">
            *** PAID ***
          </div>

          {/* FOOTER */}
          <div className="text-center text-xs mt-3">
            <p>Thank you for your patronage</p>
            <p>{format(new Date(), 'dd MMM yyyy HH:mm:ss')}</p>
          </div>

        </div>
      </div>
    );
  }
);

BarReceipt.displayName = 'BarReceipt';

export default BarReceipt;
