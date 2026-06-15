import { formatPrice } from "@/lib/utils"

type OrderItem = {
  id: string
  name: string
  sku: string
  quantity: number
  price: number
  total: number
}

export function OrderItemsTable({ items }: { items: OrderItem[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="divide-y">
          <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground pb-2">
            <div className="col-span-5">Item</div>
            <div className="col-span-2">SKU</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-2 text-right">Total</div>
          </div>
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 py-3 text-sm">
              <div className="col-span-5 font-medium">{item.name}</div>
              <div className="col-span-2 text-muted-foreground font-mono">{item.sku}</div>
              <div className="col-span-2 text-right">{formatPrice(item.price)}</div>
              <div className="col-span-1 text-center">{item.quantity}</div>
              <div className="col-span-2 text-right font-medium">{formatPrice(item.total)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
