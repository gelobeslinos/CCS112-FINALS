<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Item;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Notifications\NewOrderNotification;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        try {
            // Validate the request
            $request->validate([
                'item_id' => 'required|exists:items,id',
                'quantity' => 'required|integer|min:1',
            ]);

            // Fetch the item
            $item = Item::findOrFail($request->item_id);

            // Log the item and quantity
            \Log::info('Item found:', ['item' => $item, 'quantity' => $request->quantity]);

            // Ensure that the item is correctly associated with an employee (seller)
            if (!$item->employee_id) {
                \Log::error('Item does not have an associated employee', ['item' => $item]);
                return response()->json(['message' => 'Item does not have an associated employee.'], 400);
            }

            // Check if there's enough stock
            if ($item->quantity < $request->quantity) {
                \Log::error('Not enough quantity available', ['item' => $item, 'requested_quantity' => $request->quantity]);
                return response()->json(['message' => 'Not enough quantity available.'], 400);
            }

            // Deduct the quantity
            $item->quantity -= $request->quantity;
            $item->save();

            // Create the order
            $order = Order::create([
                'customer_id' => Auth::id(),
                'employee_id' => $item->employee_id,
                'item_id' => $item->id,
                'quantity' => $request->quantity,
                'status' => 'pending',
            ]);
            
            // Eager load customer and item to avoid null errors
            $order->load(['customer', 'item']);
            
            // Notify employee
            $employee = User::find($item->employee_id);
            if ($employee) {
                $employee->notify(new NewOrderNotification($order));
            }

            return response()->json(['message' => 'Order placed and employee notified!']);
        } catch (\Exception $e) {
            // Log the exception for debugging
            \Log::error('Error placing order: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Failed to place order. Please try again later.'], 500);
        }
    }
    
    public function accept(Order $order)
    {
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order already processed.'], 400);
        }

        // Change the order status
        $order->status = 'accepted';
        $order->save();

        // Find the notification associated with this order
        $notification = $order->customer->notifications()->where('type', NewOrderNotification::class)->first();

        if ($notification) {
            // Create an instance of NewOrderNotification
            $newOrderNotification = new NewOrderNotification($order);

            // Move the notification to transactions
            $newOrderNotification->moveToTransaction();  // This will create a transaction and delete the notification
        }

        return response()->json(['message' => 'Order accepted and notification moved to transactions.']);
    }

public function decline(Order $order)
    {
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order already processed.'], 400);
        }

        // Change the order status to declined
        $order->status = 'declined';
        $order->save();

        // Find the notification associated with this order
        $notification = $order->customer->notifications()->where('type', NewOrderNotification::class)->first();

        if ($notification) {
            // Create an instance of NewOrderNotification
            $newOrderNotification = new NewOrderNotification($order);

            // Move the notification to transactions
            $newOrderNotification->moveToTransaction();  // This will create a transaction and delete the notification
        }

        return response()->json(['message' => 'Order declined and notification moved to transactions.']);
    }

    public function myOrders()
    {
        $orders = Order::with(['item', 'employee'])
        ->where('customer_id', auth()->id())
        ->orderByDesc('created_at')
        ->get()
        ->map(function ($order) {
            return [
                'id' => $order->id,
                'quantity' => $order->quantity,
                'status' => $order->status,
                'item_name' => $order->item->name ?? 'Unknown',
                'created_at' => $order->created_at,
            ];
        });

    return response()->json($orders);
    }
}
