import React from 'react';
import { format } from 'date-fns';

interface KitchenOrderPrintProps {
  order: {
    id: string;
    created_at: string;
    order_type?: string;
    guest_name: string;
    food_name?: string;
    quantity: number;
    notes?: string;
    room_number?: string;
  };
}

const KitchenOrderPrint = React.forwardRef<HTMLDivElement, KitchenOrderPrintProps>(
  ({ order }, ref) => {
    return (
      <div ref={ref} className="pos-receipt bg-white text-black">
        <div className="print-only">

          {/* HEADER */}
          <div className="text-center mb-2">
            <h1 className="font-bold text-lg">KITCHEN ORDER</h1>
            <p className="text-xs">
              {format(new Date(order.created_at), 'dd MMM yyyy HH:mm')}
            </p>
          </div>

          <hr />

          {/* ORDER INFO */}
          <div className="text-sm my-2">
            <p><strong>Order:</strong> {order.id}</p>
            <p><strong>Guest:</strong> {order.guest_name}</p>

            {order.room_number && (
              <p><strong>Room:</strong> {order.room_number}</p>
            )}

            {order.order_type && (
              <p><strong>Type:</strong> {order.order_type}</p>
            )}
          </div>

          <hr />

          {/* FOOD */}
          <div className="text-sm my-3">
            <p className="font-bold text-base">ITEM</p>
            <p className="font-bold text-lg">
              {order.quantity} × {order.food_name}
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
            <p>Printed</p>
            <p>{format(new Date(), 'dd MMM yyyy HH:mm:ss')}</p>
          </div>

        </div>
      </div>
    );
  }
);

KitchenOrderPrint.displayName = 'KitchenOrderPrint';

export default KitchenOrderPrint;
