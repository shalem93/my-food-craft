import { Helmet } from "react-helmet-async";
import HeaderNav from "@/components/site/HeaderNav";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Package, Truck, CheckCircle2, Phone } from "lucide-react";

interface Order {
  id: string;
  delivery_status: string;
  delivery_tracking_url?: string;
  dropoff_address: string;
  dropoff_phone: string;
  external_delivery_id?: string;
  delivery_service?: string;
  amount: number;
  delivery_fee_cents?: number;
  created_at: string;
}

const OrderTracking = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      let orderId = urlParams.get('order_id');
      let paymentIntentId = urlParams.get('payment_intent_id');
      
      // If URL params are missing, try to get from localStorage
      if (!orderId && !paymentIntentId) {
        const storedOrderId = localStorage.getItem('current_order_id');
        const storedPaymentIntentId = localStorage.getItem('current_payment_intent_id');
        
        if (storedOrderId) {
          orderId = storedOrderId;
        } else if (storedPaymentIntentId) {
          paymentIntentId = storedPaymentIntentId;
        }
      } else {
        // Store in localStorage for future refreshes
        if (orderId) {
          localStorage.setItem('current_order_id', orderId);
        }
        if (paymentIntentId) {
          localStorage.setItem('current_payment_intent_id', paymentIntentId);
        }
      }
      
      console.log("Fetching order with:", { orderId, paymentIntentId });
      
      if (!orderId && !paymentIntentId) {
        console.log("No order ID or payment intent ID found in URL or localStorage");
        setLoading(false);
        return;
      }

      let query = supabase.from('orders').select('*');
      
      if (orderId) {
        query = query.eq('id', orderId);
      } else if (paymentIntentId) {
        query = query.eq('stripe_payment_intent_id', paymentIntentId);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error('Error fetching order:', error);
      } else {
        console.log("Order data:", data);
        setOrder(data);
        
        // Clear localStorage if order is delivered
        if (data.delivery_status === 'delivered') {
          localStorage.removeItem('current_order_id');
          localStorage.removeItem('current_payment_intent_id');
        }
      }
      setLoading(false);
    };

    fetchOrder();

    // Set up real-time subscription for order updates
    const urlParams = new URLSearchParams(window.location.search);
    let orderId = urlParams.get('order_id');
    let paymentIntentId = urlParams.get('payment_intent_id');

    // Also check localStorage if URL params are missing
    if (!orderId && !paymentIntentId) {
      orderId = localStorage.getItem('current_order_id');
      paymentIntentId = localStorage.getItem('current_payment_intent_id');
    }

    if (!orderId && !paymentIntentId) return;

    console.log('Setting up real-time subscription for:', { orderId, paymentIntentId });

    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: orderId ? `id=eq.${orderId}` : `stripe_payment_intent_id=eq.${paymentIntentId}`
        },
        (payload) => {
          console.log('Order updated via real-time:', payload);
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Package className="h-5 w-5 text-primary" />;
      case 'picked_up':
        return <Truck className="h-5 w-5 text-primary" />;
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Dasher Confirmed - Driver has accepted your order';
      case 'dasher_arriving':
        return 'Dasher Arriving - Driver is heading to pickup location';
      case 'picked_up':
        return 'Out for Delivery - Your order is on the way';
      case 'arriving_at_dropoff':
        return 'Almost There - Driver is arriving at your location';
      case 'delivered':
        return 'Delivered - Enjoy your meal!';
      case 'cancelled':
        return 'Cancelled - This delivery was cancelled';
      default:
        return 'Processing your order...';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'picked_up':
        return 'default';
      case 'delivered':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div>
        <HeaderNav />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p>Loading order details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <HeaderNav />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h1 className="text-2xl font-bold">Order Not Found</h1>
            <p className="text-muted-foreground">We couldn't find your order. Please check your order ID.</p>
          </div>
        </main>
      </div>
    );
  }

  // If order exists but has no delivery info, show setup message
  if (!order.dropoff_address || !order.dropoff_phone) {
    return (
      <div>
        <HeaderNav />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h1 className="text-2xl font-bold">Setting Up Your Delivery</h1>
            <p className="text-muted-foreground">We're processing your payment and setting up delivery. This may take a few moments.</p>
            <p className="text-sm text-muted-foreground">Please refresh this page in a minute to see your delivery details.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>Track Your Order | Homemade</title>
        <meta name="description" content="Track your Homemade order delivery status and get real-time updates." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "https://homemade.app/order-tracking"} />
      </Helmet>
      <HeaderNav />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Track Your Order</h1>
            <p className="text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.delivery_status)}
                  <div>
                    <CardTitle className="text-lg">
                      {getStatusText(order.delivery_status)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant={getStatusColor(order.delivery_status)}>
                        {order.delivery_status || 'Processing'}
                      </Badge>
                      {order.delivery_service && (
                        <span className="text-sm">via {order.delivery_service}</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-sm text-muted-foreground">{order.dropoff_address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Contact Number</p>
                  <p className="text-sm text-muted-foreground">{order.dropoff_phone}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Order Total</span>
                  <span className="font-bold">
                    ${((order.amount + (order.delivery_fee_cents || 0)) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Subtotal: ${(order.amount / 100).toFixed(2)}</span>
                  {order.delivery_fee_cents && (
                    <span>Delivery: ${(order.delivery_fee_cents / 100).toFixed(2)}</span>
                  )}
                </div>
              </div>

              {order.delivery_tracking_url && (
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => window.open(order.delivery_tracking_url, '_blank')}
                  >
                    Track with DoorDash
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    DoorDash ID: {order.external_delivery_id}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Delivery Updates</CardTitle>
              <CardDescription>
                We'll send SMS updates to {order.dropoff_phone} as your order progresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Order placed - {new Date(order.created_at).toLocaleTimeString()}</span>
                </div>
                {['confirmed', 'dasher_arriving', 'picked_up', 'arriving_at_dropoff', 'delivered'].includes(order.delivery_status) && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Dasher confirmed - Driver accepted your order</span>
                  </div>
                )}
                {['dasher_arriving', 'picked_up', 'arriving_at_dropoff', 'delivered'].includes(order.delivery_status) && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Dasher arrived at pickup location</span>
                  </div>
                )}
                {['picked_up', 'arriving_at_dropoff', 'delivered'].includes(order.delivery_status) && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Driver picked up your order and is on the way</span>
                  </div>
                )}
                {['arriving_at_dropoff', 'delivered'].includes(order.delivery_status) && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Driver is arriving at your location</span>
                  </div>
                )}
                {order.delivery_status === 'delivered' && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Order delivered successfully!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default OrderTracking;