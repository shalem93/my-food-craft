import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ReviewDialog from "@/components/site/ReviewDialog";
import ItemReviewDialog from "@/components/site/ItemReviewDialog";
import { Star, MessageSquare } from "lucide-react";

interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
  price_cents: number;
}

interface Order {
  id: string;
  amount: number;
  status: string;
  delivery_status: string;
  created_at: string;
  chef_user_id: string;
  delivery_tracking_url?: string;
  delivery_fee_cents?: number | null;
  pickup_business_name?: string | null;
  public_chef_info?: {
    display_name: string;
  } | null;
  order_items?: OrderItem[];
}

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [itemReviewDialogOpen, setItemReviewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ orderId: string; itemId: string; itemName: string } | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          return;
        }

        if (!ordersData || ordersData.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        // Get unique chef user IDs
        const chefUserIds = [...new Set(ordersData.map(order => order.chef_user_id).filter(Boolean))];

        // Fetch chef info for all chefs
        const { data: chefsData, error: chefsError } = await supabase
          .from('public_chef_info')
          .select('user_id, display_name')
          .in('user_id', chefUserIds);

        if (chefsError) {
          console.error('Error fetching chef info:', chefsError);
        }

        // Create a map of chef user_id to chef info
        const chefMap = new Map(
          chefsData?.map(chef => [chef.user_id, chef]) || []
        );

        // Fetch order items for all orders
        const orderIds = ordersData.map(order => order.id);
        const { data: orderItemsData } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        // Create a map of order_id to order items
        const orderItemsMap = new Map<string, OrderItem[]>();
        orderItemsData?.forEach(item => {
          if (!orderItemsMap.has(item.order_id)) {
            orderItemsMap.set(item.order_id, []);
          }
          orderItemsMap.get(item.order_id)?.push(item as OrderItem);
        });

        // Combine orders with chef info and order items
        const ordersWithChefInfo = ordersData.map(order => ({
          ...order,
          public_chef_info: order.chef_user_id ? chefMap.get(order.chef_user_id) : null,
          order_items: orderItemsMap.get(order.id) || [],
        }));

        console.log('Fetched orders:', ordersWithChefInfo);
        setOrders(ordersWithChefInfo as Order[]);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Set up real-time subscription for order updates
    if (!user) return;

    const channel = supabase
      .channel('user-orders-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Order updated:', payload);
          // Update the specific order in the list
          setOrders(prev => prev.map(order => 
            order.id === payload.new.id ? { ...order, ...(payload.new as any) } : order
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Current orders: orders that are not delivered and not stuck in payment (excluding abandoned checkouts)
  const currentOrders = orders.filter(order => 
    order.status !== 'requires_payment_method' &&
    (!order.delivery_status || (order.delivery_status && order.delivery_status !== 'delivered'))
  );
  
  // Past orders: only delivered orders
  const pastOrders = orders.filter(order => 
    order.delivery_status === 'delivered'
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderNav />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Please sign in to view your orders.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>My Orders | Homemade</title>
        <meta name="description" content="View your current and past orders" />
      </Helmet>
      
      <HeaderNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Orders</h1>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
              <Link to="/">
                <Button>Browse Chefs</Button>
              </Link>
            </div>
          ) : (
            <Tabs defaultValue="current" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current">Current Orders ({currentOrders.length})</TabsTrigger>
                <TabsTrigger value="past">Past Orders ({pastOrders.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="current" className="space-y-4">
                {currentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No current orders</p>
                  </div>
                ) : (
                  currentOrders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              Order from {order.public_chef_info?.display_name || order.pickup_business_name || 'Chef'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), 'PPP')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              ${((order.amount + (order.delivery_fee_cents || 0)) / 100).toFixed(2)}
                            </p>
                            <Badge variant={getStatusBadgeVariant(order.delivery_status)}>
                              {order.delivery_status || 'Preparing'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {order.order_items && order.order_items.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Items:</p>
                            <ul className="space-y-1">
                              {order.order_items.map((item) => (
                                <li key={item.id} className="flex justify-between text-sm text-muted-foreground">
                                  <span>{item.item_name} × {item.quantity}</span>
                                  <span>${((item.price_cents * item.quantity) / 100).toFixed(2)}</span>
                                </li>
                              ))}
                              {order.delivery_fee_cents && (
                                <li className="flex justify-between text-sm text-muted-foreground pt-1 border-t">
                                  <span>Delivery Fee</span>
                                  <span>${(order.delivery_fee_cents / 100).toFixed(2)}</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        {order.delivery_tracking_url && (
                          <Link 
                            to={`/order-tracking?order_id=${order.id}`}
                            className="text-primary hover:underline inline-block"
                          >
                            Track Order →
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="past" className="space-y-4">
                {pastOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No past orders</p>
                  </div>
                ) : (
                  pastOrders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              Order from {order.public_chef_info?.display_name || order.pickup_business_name || 'Chef'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), 'PPP')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              ${((order.amount + (order.delivery_fee_cents || 0)) / 100).toFixed(2)}
                            </p>
                            <Badge variant="default">Delivered</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {order.order_items && order.order_items.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Items:</p>
                            <ul className="space-y-2">
                              {order.order_items.map((item) => (
                                <li key={item.id} className="flex justify-between items-center text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">{item.item_name} × {item.quantity}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => {
                                        setSelectedItem({
                                          orderId: order.id,
                                          itemId: item.id,
                                          itemName: item.item_name
                                        });
                                        setItemReviewDialogOpen(true);
                                      }}
                                    >
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      Review
                                    </Button>
                                  </div>
                                  <span className="text-muted-foreground">${((item.price_cents * item.quantity) / 100).toFixed(2)}</span>
                                </li>
                              ))}
                              {order.delivery_fee_cents && (
                                <li className="flex justify-between text-sm text-muted-foreground pt-1 border-t">
                                  <span>Delivery Fee</span>
                                  <span>${(order.delivery_fee_cents / 100).toFixed(2)}</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setReviewDialogOpen(true);
                          }}
                          className="w-full"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Review Chef
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      {selectedOrder && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          orderId={selectedOrder.id}
          chefUserId={selectedOrder.chef_user_id}
          chefName={selectedOrder.public_chef_info?.display_name}
        />
      )}

      {selectedItem && (
        <ItemReviewDialog
          open={itemReviewDialogOpen}
          onOpenChange={setItemReviewDialogOpen}
          orderId={selectedItem.orderId}
          itemId={selectedItem.itemId}
          itemName={selectedItem.itemName}
        />
      )}
    </div>
  );
};

export default Orders;