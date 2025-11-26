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
import { Star } from "lucide-react";

interface Order {
  id: string;
  amount: number;
  status: string;
  delivery_status: string;
  created_at: string;
  chef_user_id: string;
  delivery_tracking_url?: string;
  public_chef_info?: {
    display_name: string;
  } | null;
}

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            public_chef_info!chef_user_id(display_name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders:', error);
          return;
        }

        console.log('Fetched orders:', data);
        setOrders(data as unknown as Order[] || []);
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

  // Current orders: orders that are not delivered (including newly created with null status)
  const currentOrders = orders.filter(order => 
    !order.delivery_status || (order.delivery_status && order.delivery_status !== 'delivered')
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
                              Order from {order.public_chef_info?.display_name || 'Chef'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), 'PPP')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${(order.amount / 100).toFixed(2)}</p>
                            <Badge variant={getStatusBadgeVariant(order.delivery_status)}>
                              {order.delivery_status || 'Preparing'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {order.delivery_tracking_url && (
                          <Link 
                            to={`/order-tracking?order_id=${order.id}`}
                            className="text-primary hover:underline"
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
                              Order from {order.public_chef_info?.display_name || 'Chef'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), 'PPP')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${(order.amount / 100).toFixed(2)}</p>
                            <Badge variant="default">Delivered</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
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
                          Write a Review
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
    </div>
  );
};

export default Orders;