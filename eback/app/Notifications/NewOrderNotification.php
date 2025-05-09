<?php

namespace App\Notifications;

use App\Models\Transaction;
use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class NewOrderNotification extends Notification
{
    use Queueable;

    protected $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return new DatabaseMessage([
            'message' => 'New order placed by ' . ($this->order->customer->name ?? 'Unknown') . 
                        ' for item ' . ($this->order->item->name ?? 'Unknown'),
            'order_id' => $this->order->id,
            'item_name' => $this->order->item->name ?? 'Unknown',
            'quantity' => $this->order->quantity,
            'status' => $this->order->status,
            'customer_name' => $this->order->customer->name ?? 'Unknown',
            'customer_email' => $this->order->customer->email ?? 'Unknown',
        ]);
    }

    // This method will move the notification to the transactions table
    public function moveToTransaction()
    {
        // Create a transaction entry
        $transaction = new Transaction();
        $transaction->order_id = $this->order->id;
        $transaction->customer_id = $this->order->customer_id;
        $transaction->item_id = $this->order->item_id;
        $transaction->quantity = $this->order->quantity;
        $transaction->status = $this->order->status; // Can be 'accepted' or 'declined'
        $transaction->save();

        // Optionally, delete the notification after it's moved
        $this->delete();
    }
}
