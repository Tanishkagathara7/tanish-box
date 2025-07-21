import { useState, useEffect, useCallback, useMemo } from "react";
import { CreditCard, Shield, Clock, MapPin, Calendar, Users, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { paymentsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Booking {
  _id?: string; // MongoDB ID
  id: string; // Legacy ID for compatibility
  bookingId: string;
  groundId?: any;
  ground?: any;
  bookingDate: string;
  timeSlot: {
    startTime: string;
    endTime: string;
    duration: number;
  };
  playerDetails: {
    teamName?: string;
    playerCount: number;
    contactPerson: {
      name: string;
      phone: string;
    };
  };
  pricing?: {
    baseAmount?: number;
    discount?: number;
    taxes?: number;
    totalAmount?: number;
    duration?: number;
    convenienceFee?: number;
  };
  amount?: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onPaymentSuccess: (booking: Booking) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Preload Razorpay script for better performance
const preloadRazorpayScript = () => {
  if (typeof window !== 'undefined' && !window.Razorpay) {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
    return new Promise((resolve, reject) => {
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
    });
  }
  return Promise.resolve(true);
};

const PaymentModal = ({
  isOpen,
  onClose,
  booking,
  onPaymentSuccess,
}: PaymentModalProps) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Preload Razorpay script when component mounts
  useEffect(() => {
    preloadRazorpayScript()
      .then(() => {
        setRazorpayLoaded(true);
      })
      .catch(() => {
        toast.error("Failed to load payment gateway");
      });
  }, []);

  // Enhanced dynamic amount calculation
  const bookingData = useMemo(() => {
    if (!booking) return null;

    const ground =
      (booking.groundId && typeof booking.groundId === "object"
        ? booking.groundId
        : booking.ground) || {};

    let firstImage = "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
    if (
      ground.images &&
      Array.isArray(ground.images) &&
      ground.images.length > 0
    ) {
      const imgItem = ground.images[0];
      if (typeof imgItem === "string") {
        firstImage = imgItem.startsWith('http') ? imgItem : "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
      } else if (imgItem && typeof imgItem === "object" && "url" in imgItem) {
        firstImage = imgItem.url && imgItem.url.startsWith('http') ? imgItem.url : "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
      }
    }

    const address =
      ground?.location?.address ||
      (ground?.location ? ground.location : "") ||
      "No address available";

    // --- Dynamic baseAmount calculation ---
    let baseAmount = booking?.pricing?.baseAmount ?? 0;
    let perHour = ground?.price?.perHour || 0;
    let duration = booking?.timeSlot?.duration || 1;
    // If price ranges exist, pick the correct perHour based on startTime
    if (Array.isArray(ground?.price?.ranges) && ground.price.ranges.length > 0 && booking?.timeSlot?.startTime) {
      const slot = ground.price.ranges.find(r => r.start === booking.timeSlot.startTime);
      if (slot) {
        perHour = slot.perHour;
      } else {
        perHour = ground.price.ranges[0].perHour;
      }
    }
    if (!baseAmount || baseAmount === 0) {
      baseAmount = perHour * duration;
    }

    const discount = booking?.pricing?.discount ?? 0;
    // --- Dynamic convenienceFee and totalAmount calculation ---
    let convenienceFee = booking?.pricing?.convenienceFee ?? 0;
    if (!convenienceFee && baseAmount > 0) {
      convenienceFee = Math.round((baseAmount - discount) * 0.02);
    }
    let totalAmount = booking?.pricing?.totalAmount ?? 0;
    if (!totalAmount && baseAmount > 0) {
      totalAmount = (baseAmount - discount) + convenienceFee;
    }

    return {
      ground,
      firstImage,
      address,
      baseAmount,
      discount,
      convenienceFee,
      totalAmount,
      duration,
    };
  }, [booking]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const handlePayment = useCallback(async () => {
    if (!booking || !user || !razorpayLoaded || !bookingData) return;

    try {
      setIsProcessing(true);

      // Create order on backend
      const orderResponse = await paymentsApi.createOrder({
        bookingId: booking._id || booking.id,
      });

      console.log("Order response:", orderResponse);

      if (!(orderResponse as any)?.success) {
        throw new Error((orderResponse as any)?.message || "Failed to create order");
      }

      const { order, key } = orderResponse as any;

      if (!key) {
        throw new Error("Razorpay key missing from server response.");
      }

      // Optimized Razorpay options
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "BoxCric",
        description: `Booking for ${bookingData.ground?.name || "Ground"}`,
        image: bookingData.firstImage,
        order_id: order.id,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        notes: {
          booking_id: booking.bookingId || booking._id || booking.id,
          ground_name: bookingData.ground?.name || "",
        },
        theme: {
          color: "#22c55e",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.error("Payment cancelled");
          },
          animation: true,
          backdropclose: false,
          escape: false,
          handleback: true,
          confirm_close: true,
        },
        config: {
          display: {
            blocks: {
              banks: {
                name: "Pay using Net Banking",
                instruments: [
                  {
                    method: "netbanking",
                    banks: ["SBIN", "ICICI", "HDFC", "AXIS", "KOTAK", "YESBANK", "IDBI", "PNB", "BOB", "UNION"]
                  }
                ]
              },
              card: {
                name: "Pay using Card",
                instruments: [
                  {
                    method: "card",
                    issuers: ["HDFC", "ICICI", "AXIS", "SBI"]
                  }
                ]
              },
              upi: {
                name: "Pay using UPI",
                instruments: [
                  {
                    method: "upi"
                  }
                ]
              }
            },
            sequence: ["block.upi", "block.card", "block.banks"],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        remember_customer: true,
        callback_url: window.location.origin + "/payment/callback",
        handler: async (response: any) => {
          try {
            const verifyResponse = await paymentsApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id || booking.id,
            });

            if ((verifyResponse as any)?.success) {
              toast.success("Payment successful! Booking confirmed.");
              onPaymentSuccess(booking);
              onClose();
            } else {
              throw new Error(
                (verifyResponse as any)?.message || "Payment verification failed",
              );
            }
          } catch (error: any) {
            console.error("Payment verification error:", error);
            toast.error(error.message || "Payment verification failed");
            await paymentsApi.paymentFailed?.({
              bookingId: booking._id || booking.id,
              razorpay_order_id: response.razorpay_order_id,
              error: error.message,
            });
          } finally {
            setIsProcessing(false);
          }
        },
      };

      // Use requestAnimationFrame for smoother modal opening
      requestAnimationFrame(() => {
        const rzp = new window.Razorpay(options);
        rzp.open();
      });
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      toast.error(error.message || "Failed to initiate payment");
      setIsProcessing(false);
    }
  }, [booking, user, razorpayLoaded, bookingData, onPaymentSuccess, onClose]);

  if (!booking || !bookingData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby="payment-desc" className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <div id="payment-desc" style={{display: 'none'}}>
          Complete your payment securely via Razorpay.
        </div>
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 bg-cricket-green/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-cricket-green" />
            </div>
            <span className="text-gray-900">Complete Payment</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Booking Summary Card */}
          <div className="bg-gradient-to-r from-cricket-green/5 to-cricket-green/10 rounded-2xl p-6 border border-cricket-green/20">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <img
                  src={bookingData.firstImage}
                  alt={bookingData.ground?.name || "Ground"}
                  className="w-20 h-20 rounded-xl object-cover shadow-md"
                  loading="lazy"
                />
                <div className="absolute -top-2 -right-2 bg-cricket-green text-white text-xs px-2 py-1 rounded-full font-medium">
                  {bookingData.duration}h
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900 mb-2">
                  {bookingData.ground?.name || "Ground"}
                </h3>
                <div className="flex items-center space-x-2 text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{bookingData.address}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-cricket-green" />
                    <span className="font-medium">{formatDate(booking.bookingDate)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Timer className="w-4 h-4 text-cricket-green" />
                    <span className="font-medium">
                      {booking.timeSlot?.startTime} - {booking.timeSlot?.endTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5 text-cricket-green" />
                <span>Team Details</span>
              </h4>
              <div className="space-y-3">
                {booking.playerDetails?.teamName && (
                  <div>
                    <span className="text-sm text-gray-600">Team Name:</span>
                    <div className="font-medium text-gray-900">{booking.playerDetails.teamName}</div>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">Players:</span>
                  <div className="font-medium text-gray-900">{booking.playerDetails?.playerCount}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Contact Person:</span>
                  <div className="font-medium text-gray-900">
                    {booking.playerDetails?.contactPerson?.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {booking.playerDetails?.contactPerson?.phone}
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Base Amount</span>
                <span className="font-medium text-gray-900">₹{formatCurrency(bookingData.baseAmount)}</span>
              </div>

              {bookingData.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{formatCurrency(bookingData.discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Convenience Fee (2%)</span>
                <span className="font-medium text-gray-900">₹{formatCurrency(bookingData.convenienceFee)}</span>
              </div>

              <div className="border-t border-gray-200 my-2"></div>

              <div className="flex justify-between items-center">
                <span className="font-bold text-base">Total Amount</span>
                <span className="text-2xl font-extrabold text-cricket-green">₹{formatCurrency(bookingData.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-green-800 mb-1">Secure Payment</div>
                <div className="text-sm text-green-700">
                  Your payment is protected by 256-bit SSL encryption and processed securely through Razorpay.
                  All major payment methods are supported.
                </div>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <div className="space-y-4">
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !razorpayLoaded || bookingData.totalAmount <= 0}
              className="w-full bg-gradient-to-r from-cricket-green to-green-600 hover:from-cricket-green/90 hover:to-green-600/90 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Payment...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-6 h-6" />
                  <span>Pay {formatCurrency(bookingData.totalAmount)}</span>
                </div>
              )}
            </Button>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>This booking will expire in 15 minutes if not paid</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;