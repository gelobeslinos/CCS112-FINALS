<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Item;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ItemController extends Controller
{
    // Get all items for the authenticated employee
    public function index()
    {
        return Item::where('employee_id', Auth::id())->get();
    }

    // Store a new item
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'quantity' => 'required|integer',
            'price' => 'required|numeric',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        // Get the authenticated user's ID
        $employeeId = Auth::id();

        // Handle image upload
        $imagePath = $request->file('image')->store('items', 'public'); // Store in public disk

        // Create item with employee_id
        $item = new Item([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'quantity' => $validated['quantity'],
            'price' => $validated['price'],
            'image' => $imagePath,
            'employee_id' => $employeeId,  // Set employee_id here
        ]);

        $item->save();

        return response()->json($item, 201); // Return created item
    }

    // Update an existing item
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'quantity' => 'required|integer',
            'price' => 'required|numeric',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $item = Item::findOrFail($id);

        // Ensure the authenticated user owns the item
        if ($item->employee_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Handle image upload if a new image is provided
        if ($request->hasFile('image')) {
            // Delete the old image if it exists
            Storage::delete('public/' . $item->image);

            // Store the new image
            $imagePath = $request->file('image')->store('items', 'public');
            $item->image = $imagePath;
        }

        // Update the item with validated data (excluding image if not provided)
        $item->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'quantity' => $validated['quantity'],
            'price' => $validated['price'],
        ]);

        return response()->json($item, 200); // Return updated item
    }

    // Delete an item
    public function destroy($id)
    {
        $item = Item::findOrFail($id);

        // Ensure the authenticated user owns the item
        if ($item->employee_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete the image associated with the item if it exists
        if ($item->image) {
            Storage::delete('public/' . $item->image);
        }

        // Delete the item
        $item->delete();

        return response()->json(['message' => 'Item deleted successfully'], 200);
    }
    public function getItemsForSale()
    {
        // Fetch all items that are available for sale (quantity > 0)
        $items = Item::where('quantity', '>', 0)->get(); // Assuming 'quantity' is the stock of the item

        return response()->json($items);
}

} 