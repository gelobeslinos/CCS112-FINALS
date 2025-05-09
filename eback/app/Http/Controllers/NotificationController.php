<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Transaction;

class NotificationController extends Controller
{
    public function accept($id)
    {
        $notification = auth()->user()->notifications()->findOrFail($id);
        $data = $notification->data;

        $order = Order::findOrFail($data['order_id']);
        $order->status = 'accepted';
        $order->save();

        Transaction::create([
            'order_id' => $order->id,
            'customer_id' => $order->customer_id,
            'item_id' => $order->item_id,
            'quantity' => $order->quantity,
            'status' => 'accepted',
        ]);

        $notification->delete();

        return response()->json(['message' => 'Order accepted successfully.']);
    }

    public function decline($id)
    {
        $notification = auth()->user()->notifications()->findOrFail($id);
        $data = $notification->data;

        $order = Order::findOrFail($data['order_id']);
        $order->status = 'declined';
        $order->save();

        Transaction::create([
            'order_id' => $order->id,
            'customer_id' => $order->customer_id,
            'item_id' => $order->item_id,
            'quantity' => $order->quantity,
            'status' => 'declined',
        ]);

        $notification->delete();

        return response()->json(['message' => 'Order declined and recorded.']);
    }
}

