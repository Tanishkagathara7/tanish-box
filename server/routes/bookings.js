import express from "express";
import { fallbackGrounds } from "../data/fallbackGrounds.js";
import { authMiddleware } from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Ground from "../models/Ground.js";

const router = express.Router();

// Utility to calculate pricing
function getPricing(ground, timeSlot) {
  let duration = 1;
  let perHour = ground.price?.perHour || 500;
  if (timeSlot && typeof timeSlot === "object" && timeSlot.duration) {
    duration = Number(timeSlot.duration) || 1;
  }
  // If price ranges exist, pick the correct perHour based on startTime
  if (Array.isArray(ground.price?.ranges) && ground.price.ranges.length > 0 && timeSlot?.startTime) {
    const slot = ground.price.ranges.find(r => r.start === timeSlot.startTime);
    if (slot) {
      perHour = slot.perHour;
    } else {
      // fallback: pick the first range
      perHour = ground.price.ranges[0].perHour;
    }
  }
  const baseAmount = perHour * duration;
  const discount = ground.price?.discount || 0;
  const discountedAmount = baseAmount - discount;
  const convenienceFee = Math.round(discountedAmount * 0.02); // 2% convenience fee
  const totalAmount = discountedAmount + convenienceFee;
  return {
    baseAmount,
    discount,
    convenienceFee,
    totalAmount,
    duration,
  };
}

// Create a booking (authenticated)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { groundId, bookingDate, timeSlot, playerDetails, requirements } = req.body;
    const userId = req.userId;

    console.log("Booking creation request:", {
      groundId,
      bookingDate,
      timeSlot,
      playerDetails,
      requirements,
      userId
    });

    // Validate required fields
    if (!groundId || !bookingDate || !timeSlot || !playerDetails) {
      console.log("Missing required fields:", {
        groundId: !!groundId,
        bookingDate: !!bookingDate,
        timeSlot: !!timeSlot,
        playerDetails: !!playerDetails
      });
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    // Check if ground exists - handle both MongoDB and fallback grounds
    let ground = null;
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(groundId);
    
    console.log("Ground ID validation:", { groundId, isValidObjectId });
    
    if (isValidObjectId) {
      // Try to find in MongoDB
      ground = await Ground.findById(groundId);
      console.log("MongoDB ground found:", !!ground);
    }
    
    // If not found in MongoDB, check fallback data
    if (!ground) {
      ground = fallbackGrounds.find(g => g._id === groundId);
      console.log("Fallback ground found:", !!ground);
    }
    
    if (!ground) {
      console.log("No ground found for ID:", groundId);
      return res.status(400).json({ 
        success: false, 
        message: "Ground not found" 
      });
    }

    console.log("Ground found:", ground.name);

    // Parse time slot (format: "10:00-12:00")
    const [startTime, endTime] = timeSlot.split("-");
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    console.log("Time slot parsing:", { startTime, endTime, duration });

    // Check if slot is already booked (only for MongoDB grounds)
    // Temporarily disabled to fix booking issues
    /*
    if (isValidObjectId) {
      const existingBooking = await Booking.findOne({
        groundId,
        bookingDate: new Date(bookingDate),
        "timeSlot.startTime": startTime,
        "timeSlot.endTime": endTime,
        status: { $in: ["pending", "confirmed"] }
      });

      if (existingBooking) {
        console.log("Slot already booked");
        return res.status(400).json({ 
          success: false, 
          message: "Slot already booked" 
        });
      }
    }
    */

    // Calculate pricing
    const { baseAmount, discount, convenienceFee, totalAmount, duration: calcDuration } = getPricing(ground, timeSlot);

    console.log("Pricing calculation:", { baseAmount, discount, convenienceFee, totalAmount });

    // Generate unique booking ID
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const bookingId = `BC${timestamp}${random}`.toUpperCase();

    // Create booking
    const booking = new Booking({
      bookingId,
      userId,
      groundId,
      bookingDate: new Date(bookingDate),
      timeSlot: {
        startTime,
        endTime,
        duration
      },
      playerDetails: {
        teamName: playerDetails.teamName,
        playerCount: playerDetails.playerCount,
        contactPerson: playerDetails.contactPerson,
        requirements
      },
      pricing: {
        baseAmount,
        discount,
        convenienceFee,
        totalAmount,
        currency: "INR"
      },
      status: "pending"
    });

    console.log("Saving booking...");
    await booking.save();
    console.log("Booking saved successfully");

    // Populate ground details if it's a MongoDB ground
    if (isValidObjectId) {
      await booking.populate("groundId", "name location price features");
    } else {
      // For fallback grounds, manually add ground details
      booking.groundId = ground;
    }

    console.log("Booking created successfully:", booking.bookingId);
    res.json({ 
      success: true, 
      booking: booking.toObject() 
    });

  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create booking" 
    });
  }
});

// Get user's bookings (authenticated)
router.get("/my-bookings", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Process bookings to handle both MongoDB and fallback grounds
    const processedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const bookingObj = booking.toObject();
        
        // Check if groundId is a valid ObjectId
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(bookingObj.groundId);
        
        if (isValidObjectId) {
          // Populate from MongoDB
          await booking.populate("groundId", "name location price features");
          bookingObj.groundId = booking.groundId;
        } else {
          // Find in fallback data
          const fallbackGround = fallbackGrounds.find(g => g._id === bookingObj.groundId);
          if (fallbackGround) {
            bookingObj.groundId = fallbackGround;
          }
        }
        
        return bookingObj;
      })
    );

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings: processedBookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch bookings" 
    });
  }
});

// Get booking details by ID (authenticated)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.userId;
    if (!bookingId || bookingId === "undefined") {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }
    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found" 
      });
    }

    const bookingObj = booking.toObject();
    
    // Check if groundId is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(bookingObj.groundId);
    
    if (isValidObjectId) {
      // Populate from MongoDB
      await booking.populate("groundId", "name location price features");
      bookingObj.groundId = booking.groundId;
    } else {
      // Find in fallback data
      const fallbackGround = fallbackGrounds.find(g => g._id === bookingObj.groundId);
      if (fallbackGround) {
        bookingObj.groundId = fallbackGround;
      }
    }

    res.json({ 
      success: true, 
      booking: bookingObj 
    });

  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch booking" 
    });
  }
});

// Update booking status (authenticated)
router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.userId;
    if (!bookingId || bookingId === "undefined") {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }
    const { status, reason } = req.body;

    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found" 
      });
    }

    booking.status = status;
    if (reason) {
      booking.cancellationReason = reason;
    }

    await booking.save();

    res.json({ 
      success: true, 
      booking: booking.toObject() 
    });

  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update booking status" 
    });
  }
});

// Get bookings for a ground and date (for availability check)
router.get("/ground/:groundId/:date", async (req, res) => {
  try {
    const { groundId, date } = req.params;

    const bookings = await Booking.find({
      groundId,
      bookingDate: date,
      status: { $in: ["pending", "confirmed"] }
    }).select("timeSlot status");

    res.json({ 
      success: true, 
      bookings: bookings.map(booking => booking.toObject()) 
    });

  } catch (error) {
    console.error("Error fetching ground bookings:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch ground bookings" 
    });
  }
});

// Get all bookings for grounds owned by the logged-in ground owner
router.get("/owner", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "ground_owner") {
      return res.status(403).json({ success: false, message: "Access denied. Not a ground owner." });
    }
    // Find all grounds owned by this user
    const grounds = await Ground.find({ "owner.userId": req.userId }, { _id: 1 });
    const groundIds = grounds.map(g => g._id);
    // Find all bookings for these grounds
    const bookings = await Booking.find({ groundId: { $in: groundIds } }).populate("userId", "name email");
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch bookings", error: error.message });
  }
});

// Approve a booking (set status to 'confirmed') by ground owner
router.patch("/:id/approve", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "ground_owner") {
      return res.status(403).json({ success: false, message: "Access denied. Not a ground owner." });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    // Check if the booking's ground belongs to this owner
    const ground = await Ground.findById(booking.groundId);
    if (!ground || String(ground.owner.userId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: "You do not own this ground." });
    }
    if (booking.status !== "pending") {
      return res.status(400).json({ success: false, message: "Only pending bookings can be approved." });
    }
    booking.status = "confirmed";
    await booking.save();
    res.json({ success: true, message: "Booking approved.", booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to approve booking", error: error.message });
  }
});

// Demo routes for backward compatibility
export const demoBookings = [];

// Create a booking (demo - for backward compatibility)
router.post("/demo", (req, res) => {
  const { groundId, bookingDate, timeSlot, playerDetails, requirements } = req.body;
  const ground = fallbackGrounds.find((g) => g._id === groundId);
  if (!ground) {
    return res.status(400).json({ success: false, message: "Ground not found" });
  }
  // Check if slot is already booked
  const alreadyBooked = demoBookings.some(
    (b) => b.groundId === groundId && b.bookingDate === bookingDate && b.timeSlot === timeSlot
  );
  if (alreadyBooked) {
    return res.status(400).json({ success: false, message: "Slot already booked" });
  }
  const pricing = getPricing(ground, timeSlot);
  const nowId = `${Date.now()}`;
  const booking = {
    _id: nowId,
    id: nowId, // For frontend compatibility
    groundId,
    bookingDate,
    timeSlot,
    playerDetails,
    requirements,
    createdAt: new Date().toISOString(),
    amount: pricing.totalAmount, // legacy field
    currency: "INR",
    pricing,
    status: "pending",
  };
  demoBookings.push(booking);

  const safeGround = {
    _id: ground._id || booking.groundId,
    name: ground.name || "Unknown Ground",
    description: ground.description || "",
    location: ground.location || {},
    price: ground.price || {},
    images: ground.images || [],
    amenities: ground.amenities || [],
    features: ground.features || {},
    availability: ground.availability || {},
    status: ground.status || "active",
    isVerified: ground.isVerified !== undefined ? ground.isVerified : true,
    totalBookings: ground.totalBookings || 0,
    rating: ground.rating || { average: 0, count: 0, reviews: [] },
    owner: ground.owner || {},
    verificationDocuments: ground.verificationDocuments || {},
    policies: ground.policies || {},
  };

  res.json({ success: true, booking: { ...booking, id: booking._id, ground: safeGround } });
});

// Get booking details by ID (demo - for backward compatibility)
router.get("/demo/:id", (req, res) => {
  const booking = demoBookings.find((b) => b._id === req.params.id);
    if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }
  const ground = fallbackGrounds.find((g) => g._id === booking.groundId) || {};
  let pricing = booking.pricing;
  if (!pricing) {
    pricing = getPricing(ground, booking.timeSlot);
    booking.pricing = pricing;
  }

  const safeGround = {
    _id: ground._id || booking.groundId,
    name: ground.name || "Unknown Ground",
    description: ground.description || "",
    location: ground.location || {},
    price: ground.price || {},
    images: ground.images || [],
    amenities: ground.amenities || [],
    features: ground.features || {},
    availability: ground.availability || {},
    status: ground.status || "active",
    isVerified: ground.isVerified !== undefined ? ground.isVerified : true,
    totalBookings: ground.totalBookings || 0,
    rating: ground.rating || { average: 0, count: 0, reviews: [] },
    owner: ground.owner || {},
    verificationDocuments: ground.verificationDocuments || {},
    policies: ground.policies || {},
  };
  res.json({ success: true, booking: { ...booking, id: booking._id, ground: safeGround, pricing } });
});

export default router;