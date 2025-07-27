// Test file to simulate new bookings for notification testing
// Run this file to test the notification system in the owner panel

const fetch = require('node-fetch');

async function testNotification() {
  try {
    console.log('🧪 Testing notification system...');
    
    // First, let's create a test booking
    const bookingData = {
      groundId: '685fd6d5e6ff50a16aed3672', // Use an existing ground ID
      bookingDate: new Date().toISOString().split('T')[0], // Today's date
      timeSlot: '15:00-16:00', // 3:00 PM - 4:00 PM
      playerDetails: {
        teamName: 'Test Team',
        playerCount: 8,
        contactPerson: {
          name: 'Test User',
          phone: '1234567890',
          email: 'test@example.com'
        }
      },
      requirements: 'Test booking for notification system'
    };

    console.log('📝 Creating test booking...');
    console.log('Booking data:', bookingData);

    const response = await fetch('http://localhost:3001/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Test booking created successfully!');
      console.log('Booking ID:', data.booking.bookingId);
      console.log('📢 This should trigger a notification in the owner panel');
      console.log('');
      console.log('To test:');
      console.log('1. Open the owner panel in your browser');
      console.log('2. Wait for the notification to appear (should be within 10 seconds)');
      console.log('3. Check for:');
      console.log('   - Toast notification');
      console.log('   - Audio notification sound');
      console.log('   - Browser notification (if permission granted)');
      console.log('   - Notification badge on the 🔔 button');
      console.log('   - Notification badge in browser tab title');
    } else {
      console.log('❌ Failed to create test booking:', data.message);
    }
  } catch (error) {
    console.error('❌ Error testing notification:', error);
  }
}

// Run the test
testNotification(); 