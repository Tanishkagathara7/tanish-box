// Admin Panel JavaScript
let token = localStorage.getItem('adminToken');
let currentSection = 'grounds';
let bookingsCache = [];
let selectedBookingId = null;


const BASE_API_URL = 'http://localhost:4000';

// Check if already logged in
if (token) {
    showMainContent();
} else {
    // Show login form if not logged in
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('userSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
}

// Login Form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${BASE_API_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

        const data = await response.json();
  if (data.token) {
    token = data.token;
            localStorage.setItem('adminToken', token);
            showMainContent();
  } else {
            alert('Login failed: ' + (data.message || 'Invalid credentials'));
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login error: ' + error.message);
    }
});

function showMainContent() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('userSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('userEmail').textContent = 'admin@boxcric.com';
    
    // Only load data if we have a valid token
    if (token) {
        loadGrounds();
        loadLocations();
        populateCityDropdown();
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    token = null;
    location.reload();
}

// Navigation
function showSection(section) {
    currentSection = section;
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide sections
    document.getElementById('groundsSection').style.display = section === 'grounds' ? 'block' : 'none';
    document.getElementById('locationsSection').style.display = section === 'locations' ? 'block' : 'none';
    document.getElementById('bookingsSection').style.display = section === 'bookings' ? 'block' : 'none';
    
    if (section === 'bookings') {
        loadBookings();
    }
}

// Grounds Management
function showAddGroundForm() {
    document.getElementById('addGroundForm').style.display = 'block';
    document.getElementById('groundsList').style.display = 'none';
    document.getElementById('ownerPassword').value = '';
}

function hideAddGroundForm() {
    document.getElementById('addGroundForm').style.display = 'none';
    document.getElementById('groundsList').style.display = 'block';
    document.getElementById('groundForm').reset();
}

// --- Dynamic Price Ranges Logic ---
const hourOptions = Array.from({length: 24}, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `<option value="${hour}:00">${hour}:00</option>`;
});

function setDropdownOptions(select, value) {
  select.innerHTML = hourOptions.join('');
  if (value) select.value = value;
}

function updateSecondSlot() {
  const firstStart = document.querySelector('.price-range-row[data-idx="0"] .price-range-start').value;
  const firstEnd = document.querySelector('.price-range-row[data-idx="0"] .price-range-end').value;
  const secondStart = document.querySelector('.price-range-row[data-idx="1"] .price-range-start');
  const secondEnd = document.querySelector('.price-range-row[data-idx="1"] .price-range-end');
  secondStart.value = firstEnd;
  secondEnd.value = firstStart;
}

document.addEventListener('DOMContentLoaded', () => {
  // Set dropdowns for both rows
  setDropdownOptions(document.querySelector('.price-range-row[data-idx="0"] .price-range-start'), '20:00');
  setDropdownOptions(document.querySelector('.price-range-row[data-idx="0"] .price-range-end'), '08:00');
  setDropdownOptions(document.querySelector('.price-range-row[data-idx="1"] .price-range-start'), '08:00');
  setDropdownOptions(document.querySelector('.price-range-row[data-idx="1"] .price-range-end'), '20:00');

  // Initial update
  updateSecondSlot();

  // Listen for changes on first slot
  document.querySelector('.price-range-row[data-idx="0"] .price-range-start').addEventListener('change', updateSecondSlot);
  document.querySelector('.price-range-row[data-idx="0"] .price-range-end').addEventListener('change', updateSecondSlot);
});

// --- END Dynamic Price Ranges Logic ---

// --- Edit Ground Logic ---
let editingGroundId = null;

window.editGround = async function(id) {
  try {
    const response = await fetch(`${BASE_API_URL}/api/admin/grounds`, { headers: { 'Authorization': `Bearer ${token}` } });
    const grounds = await response.json();
    const ground = grounds.find(g => g._id === id);
    if (!ground) return alert('Ground not found!');
    editingGroundId = id;
    // Show form
    showAddGroundForm();
    // Populate fields
    document.getElementById('groundName').value = ground.name;
    document.getElementById('groundDescription').value = ground.description;
    document.getElementById('groundCity').value = ground.location.cityId;
    document.getElementById('groundAddress').value = ground.location.address;
    document.getElementById('groundPincode').value = ground.location.pincode;
    // Price ranges
    const ranges = ground.price?.ranges || [{start:'',end:'',perHour:''},{start:'',end:'',perHour:''}];
    setDropdownOptions(document.querySelector('.price-range-row[data-idx="0"] .price-range-start'), ranges[0].start);
    setDropdownOptions(document.querySelector('.price-range-row[data-idx="0"] .price-range-end'), ranges[0].end);
    setDropdownOptions(document.querySelector('.price-range-row[data-idx="1"] .price-range-start'), ranges[1].start);
    setDropdownOptions(document.querySelector('.price-range-row[data-idx="1"] .price-range-end'), ranges[1].end);
    document.querySelector('.price-range-row[data-idx="0"] .price-range-perHour').value = ranges[0].perHour;
    document.querySelector('.price-range-row[data-idx="1"] .price-range-perHour').value = ranges[1].perHour;
    // Discount
    document.getElementById('groundDiscount').value = ground.price?.discount || 0;
    // Images
    document.getElementById('groundImage1').value = ground.images[0]?.url || '';
    document.getElementById('groundImage2').value = ground.images[1]?.url || '';
    document.getElementById('groundImage3').value = ground.images[2]?.url || '';
    // Features
    document.getElementById('groundPitchType').value = ground.features.pitchType;
    document.getElementById('groundCapacity').value = ground.features.capacity;
    document.getElementById('groundLighting').checked = ground.features.lighting;
    document.getElementById('groundParking').checked = ground.features.parking;
    document.getElementById('groundChangeRoom').checked = ground.features.changeRoom;
    document.getElementById('groundWashroom').checked = ground.features.washroom;
    document.getElementById('groundCafeteria').checked = ground.features.cafeteria;
    document.getElementById('groundEquipment').checked = ground.features.equipment;
    // Owner
    document.getElementById('ownerName').value = ground.owner.name;
    document.getElementById('ownerEmail').value = ground.owner.email;
    document.getElementById('ownerContact').value = ground.owner.contact;
    document.getElementById('ownerPassword').value = ground.owner.password || '';
    document.getElementById('ownerUserId').value = ground.owner.userId || '';
    // Rating
    document.getElementById('groundRating').value = ground.rating?.average || 0;
    document.getElementById('groundRatingCount').value = ground.rating?.count || 0;
    // Policies
    document.getElementById('cancellationPolicy').value = ground.policies.cancellation || '';
    document.getElementById('advanceBooking').value = ground.policies.advanceBooking || 30;
    document.getElementById('groundRules').value = (ground.policies.rules || []).join('\n');
    // Change submit button text
    document.querySelector('#groundForm button[type="submit"]').textContent = 'Update Ground';
  } catch (err) {
    alert('Error loading ground for edit');
  }
};

// Update form submission logic
const groundForm = document.getElementById('groundForm');
groundForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // ... existing code to build formData ...
    const formData = {
        name: document.getElementById('groundName').value,
        description: document.getElementById('groundDescription').value,
        location: {
            cityId: document.getElementById('groundCity').value,
            address: document.getElementById('groundAddress').value,
            pincode: document.getElementById('groundPincode').value,
        },
        price: {
            ranges: [0, 1].map(idx => {
                const container = document.getElementById('priceRangesContainer');
                const row = container.querySelector(`.price-range-row[data-idx="${idx}"]`);
                const start = row.querySelector('.price-range-start').value;
                const end = row.querySelector('.price-range-end').value;
                const perHour = row.querySelector('.price-range-perHour').value;
                return { start, end, perHour: Number(perHour) };
            }),
            currency: "INR",
            discount: Number(document.getElementById('groundDiscount').value) || 0
        },
        images: [],
        amenities: [],
        features: {
            pitchType: document.getElementById('groundPitchType').value,
            capacity: Number(document.getElementById('groundCapacity').value),
            lighting: document.getElementById('groundLighting').checked,
            parking: document.getElementById('groundParking').checked,
            changeRoom: document.getElementById('groundChangeRoom').checked,
            washroom: document.getElementById('groundWashroom').checked,
            cafeteria: document.getElementById('groundCafeteria').checked,
            equipment: document.getElementById('groundEquipment').checked
        },
        owner: {
            name: document.getElementById('ownerName').value,
            email: document.getElementById('ownerEmail').value,
            contact: document.getElementById('ownerContact').value,
            password: document.getElementById('ownerPassword').value,
            verified: true,
            userId: document.getElementById('ownerUserId').value || undefined
        },
        rating: {
            average: Number(document.getElementById('groundRating').value) || 0,
            count: Number(document.getElementById('groundRatingCount').value) || 0,
            reviews: []
        },
        policies: {
            cancellation: document.getElementById('cancellationPolicy').value || "Free cancellation up to 24 hours before booking",
            advanceBooking: Number(document.getElementById('advanceBooking').value) || 30,
            rules: document.getElementById('groundRules').value.split('\n').filter(rule => rule.trim())
        }
    };
    // Images
    const image1 = document.getElementById('groundImage1').value;
    const image2 = document.getElementById('groundImage2').value;
    const image3 = document.getElementById('groundImage3').value;
    if (image1) {
        formData.images.push({ url: image1, alt: formData.name, isPrimary: true });
    }
    if (image2) {
        formData.images.push({ url: image2, alt: formData.name + " - View 2", isPrimary: false });
    }
    if (image3) {
        formData.images.push({ url: image3, alt: formData.name + " - View 3", isPrimary: false });
    }
    if (formData.images.length === 0) {
        formData.images.push({ 
            url: "https://via.placeholder.com/400x300/cccccc/666666?text=Ground+Image", 
            alt: formData.name, 
            isPrimary: true 
        });
    }
    // Amenities
    document.querySelectorAll('input[type="checkbox"][value]').forEach(checkbox => {
        if (checkbox.checked) {
            formData.amenities.push(checkbox.value);
        }
    });
    try {
        let response, data;
        if (editingGroundId) {
            response = await fetch(`${BASE_API_URL}/api/admin/grounds/${editingGroundId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            data = await response.json();
        } else {
            response = await fetch(`${BASE_API_URL}/api/admin/grounds`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            data = await response.json();
        }
        if (response.ok) {
            alert(editingGroundId ? 'Ground updated successfully!' : 'Ground added successfully!');
            hideAddGroundForm();
            loadGrounds();
            editingGroundId = null;
            document.querySelector('#groundForm button[type="submit"]').textContent = 'Add Ground';
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Reset editing state when hiding form
const originalHideAddGroundForm = hideAddGroundForm;
hideAddGroundForm = function() {
  editingGroundId = null;
  document.querySelector('#groundForm button[type="submit"]').textContent = 'Add Ground';
  originalHideAddGroundForm();
};

async function loadGrounds() {
    try {
        const response = await fetch(`${BASE_API_URL}/api/admin/grounds`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('adminToken');
                token = null;
                location.reload();
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        let grounds = await response.json();
        
        // Ensure grounds is an array
        if (!Array.isArray(grounds)) {
            if (grounds && Array.isArray(grounds.grounds)) {
                grounds = grounds.grounds;
            } else {
                console.error('Expected array of grounds, got:', grounds);
                return;
            }
        }
        
        const tbody = document.getElementById('groundsTableBody');
        tbody.innerHTML = '';
        
        grounds.forEach(ground => {
            const row = document.createElement('tr');
            let priceHtml = '';
            if (Array.isArray(ground.price?.ranges)) {
              ground.price.ranges.forEach(range => {
                priceHtml += `<div>${range.start} - ${range.end}: ₹${range.perHour}</div>`;
              });
            } else {
              priceHtml = '<div>No pricing info</div>';
            }
            const ratingHtml = ground.rating?.average ? 
                `<div class="rating-display">
                    <span class="rating-star">★</span>
                    <span class="rating-value">${ground.rating.average}</span>
                    <span class="rating-count">(${ground.rating.count})</span>
                </div>` : 
                '<span style="color: #666;">No rating</span>';
            
            row.innerHTML = `
                <td>${ground.name}</td>
                <td>${ground.location?.cityName || 'N/A'}</td>
                <td>${priceHtml}</td>
                <td>${ratingHtml}</td>
                <td><span class="status ${ground.status}">${ground.status}</span></td>
                <td>
                    <button onclick="editGround('${ground._id}')" class="btn-small">Edit</button>
                    <button onclick="deleteGround('${ground._id}')" class="btn-small btn-danger">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading grounds:', error);
        alert('Error loading grounds: ' + error.message);
    }
}

async function deleteGround(id) {
    if (!confirm('Are you sure you want to delete this ground?')) return;
    
    try {
        const response = await fetch(`${BASE_API_URL}/api/admin/grounds/${id}`, {
    method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
  });
        
        if (response.ok) {
            alert('Ground deleted successfully!');
  loadGrounds();
        } else {
            alert('Error deleting ground');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Locations Management
function showAddLocationForm() {
    document.getElementById('addLocationForm').style.display = 'block';
    document.getElementById('locationsList').style.display = 'none';
}

function hideAddLocationForm() {
    document.getElementById('addLocationForm').style.display = 'none';
    document.getElementById('locationsList').style.display = 'block';
    document.getElementById('locationForm').reset();
}

// Location Form Submission
document.getElementById('locationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        id: document.getElementById('locationId').value,
        name: document.getElementById('locationName').value,
        state: document.getElementById('locationState').value,
        latitude: Number(document.getElementById('locationLat').value),
        longitude: Number(document.getElementById('locationLng').value),
        popular: document.getElementById('locationPopular').checked
    };

    try {
        const response = await fetch(`${BASE_API_URL}/api/admin/locations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (response.ok) {
            alert('Location added successfully!');
            hideAddLocationForm();
            loadLocations();
            populateCityDropdown();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        alert('Error adding location: ' + error.message);
    }
});

async function loadLocations() {
    try {
        const response = await fetch(`${BASE_API_URL}/api/admin/locations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('adminToken');
                token = null;
                location.reload();
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        let locations = await response.json();
        
        // Ensure locations is an array
        if (!Array.isArray(locations)) {
            if (locations && Array.isArray(locations.locations)) {
                locations = locations.locations;
            } else {
                console.error('Expected array of locations, got:', locations);
                return;
            }
        }
        
        const dropdown = document.getElementById('groundCity');
        dropdown.innerHTML = '<option value="">Select City</option>';
        
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.id;
            option.textContent = `${location.name}, ${location.state}`;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading cities:', error);
        alert('Error loading cities: ' + error.message);
    }
}

async function populateCityDropdown() {
    try {
        const response = await fetch(`${BASE_API_URL}/api/admin/locations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('adminToken');
                token = null;
                location.reload();
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        let locations = await response.json();
        
        // Ensure locations is an array
        if (!Array.isArray(locations)) {
            if (locations && Array.isArray(locations.locations)) {
                locations = locations.locations;
            } else {
                console.error('Expected array of locations, got:', locations);
                return;
            }
        }
        
        const dropdown = document.getElementById('groundCity');
        dropdown.innerHTML = '<option value="">Select City</option>';
        
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.id;
            option.textContent = `${location.name}, ${location.state}`;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading cities:', error);
        alert('Error loading cities: ' + error.message);
    }
}

async function loadBookings() {
  const token = localStorage.getItem('adminToken');
  if (!token) return;
  try {
    const response = await fetch(`${BASE_API_URL}/api/admin/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch bookings');
    bookingsCache = data.bookings;
    renderBookingsTable(bookingsCache);
  } catch (error) {
    console.error('Error loading bookings:', error);
    alert('Error loading bookings: ' + error.message);
  }
}

function renderBookingsTable(bookings) {
  const tbody = document.getElementById('bookingsTableBody');
  tbody.innerHTML = '';
  bookings.forEach(booking => {
    const userName = booking.userId && booking.userId.name ? booking.userId.name : booking.userId || '';
    const groundName = booking.groundId && booking.groundId.name ? booking.groundId.name : booking.groundId || '';
    let actionHtml = '';
    if (booking.status !== 'confirmed') {
      actionHtml = `<button class="btn-small btn-primary" data-confirm-id="${booking._id}">Confirm</button>`;
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${booking.bookingId || ''}</td>
      <td>${userName}</td>
      <td>${groundName}</td>
      <td>${booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : ''}</td>
      <td>${booking.timeSlot ? `${booking.timeSlot.startTime} - ${booking.timeSlot.endTime}` : ''}</td>
      <td>${booking.status || ''}</td>
      <td>${booking.pricing ? booking.pricing.totalAmount : ''}</td>
      <td>${actionHtml}</td>
    `;
    tbody.appendChild(tr);
  });
  // Attach event listeners for confirm buttons
  tbody.querySelectorAll('button[data-confirm-id]').forEach(btn => {
    btn.onclick = async function() {
      const id = btn.getAttribute('data-confirm-id');
      try {
        const response = await fetch(`${BASE_API_URL}/api/admin/bookings/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'confirmed' })
        });
        const data = await response.json();
        if (data.success) {
          alert('Booking confirmed!');
          loadBookings();
        } else {
          alert('Error confirming booking: ' + (data.message || ''));
        }
      } catch (err) {
        alert('Error confirming booking: ' + err.message);
      }
    };
  });
}

// Search functionality
const bookingSearchInput = document.getElementById('bookingSearchInput');
if (bookingSearchInput) {
  bookingSearchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase();
    const filtered = bookingsCache.filter(b => {
      const userName = b.userId && b.userId.name ? b.userId.name : b.userId || '';
      const groundName = b.groundId && b.groundId.name ? b.groundId.name : b.groundId || '';
      return (
        (b.bookingId && b.bookingId.toLowerCase().includes(query)) ||
        (userName && userName.toLowerCase().includes(query)) ||
        (groundName && groundName.toLowerCase().includes(query)) ||
        (b.status && b.status.toLowerCase().includes(query))
      );
    });
    renderBookingsTable(filtered);
  });
}

// View Booking
window.viewBooking = function(id) {
  const booking = bookingsCache.find(b => b._id === id);
  if (!booking) return;
  selectedBookingId = id;
  const userName = booking.userId && booking.userId.name ? booking.userId.name : booking.userId || '';
  const groundName = booking.groundId && booking.groundId.name ? booking.groundId.name : booking.groundId || '';
  const statusOptions = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
  const details = `
    <p><b>Booking ID:</b> ${booking.bookingId}</p>
    <p><b>User:</b> ${userName}</p>
    <p><b>Ground:</b> ${groundName}</p>
    <p><b>Date:</b> ${booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : ''}</p>
    <p><b>Time Slot:</b> ${booking.timeSlot ? `${booking.timeSlot.startTime} - ${booking.timeSlot.endTime}` : ''}</p>
    <p><b>Status:</b> <select id="bookingStatusSelect">${statusOptions.map(opt => `<option value="${opt}" ${booking.status===opt?'selected':''}>${opt}</option>`).join('')}</select></p>
    <p><b>Total Amount:</b> ${booking.pricing ? booking.pricing.totalAmount : ''}</p>
    <p><b>Player Details:</b> ${booking.playerDetails ? JSON.stringify(booking.playerDetails) : ''}</p>
    <p><b>Payment:</b> ${booking.payment ? JSON.stringify(booking.payment) : ''}</p>
    <button id="editBookingBtn" class="btn-primary">Edit</button>
    <button id="deleteBookingBtn" class="btn-danger">Delete</button>
  `;
  document.getElementById('bookingDetailsContent').innerHTML = details;
  document.getElementById('bookingModal').style.display = 'block';
  // Status change handler
  document.getElementById('bookingStatusSelect').onchange = async function() {
    const newStatus = this.value;
    try {
      const response = await fetch(`${BASE_API_URL}/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        alert('Status updated!');
        document.getElementById('bookingModal').style.display = 'none';
        loadBookings();
      } else {
        alert('Error updating status: ' + (data.message || ''));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };
  // Attach modal button handlers
  document.getElementById('editBookingBtn').onclick = function() {
    // Show edit form in modal
    const editFormHtml = `
      <form id="editBookingForm">
        <label>Status:
          <select name="status" id="editStatus">
            ${statusOptions.map(opt => `<option value="${opt}" ${booking.status===opt?'selected':''}>${opt}</option>`).join('')}
          </select>
        </label><br>
        <label>Date:
          <input type="date" id="editDate" value="${booking.bookingDate ? new Date(booking.bookingDate).toISOString().split('T')[0] : ''}" />
        </label><br>
        <label>Start Time:
          <input type="text" id="editStartTime" value="${booking.timeSlot ? booking.timeSlot.startTime : ''}" placeholder="e.g. 10:00" />
        </label><br>
        <label>End Time:
          <input type="text" id="editEndTime" value="${booking.timeSlot ? booking.timeSlot.endTime : ''}" placeholder="e.g. 12:00" />
        </label><br>
        <label>Player Details (JSON):
          <textarea id="editPlayerDetails" rows="3">${booking.playerDetails ? JSON.stringify(booking.playerDetails, null, 2) : ''}</textarea>
        </label><br>
        <button type="submit" class="btn-primary">Save</button>
        <button type="button" id="cancelEditBtn" class="btn-secondary">Cancel</button>
      </form>
    `;
    document.getElementById('bookingDetailsContent').innerHTML = editFormHtml;
    document.getElementById('editBookingForm').onsubmit = async function(e) {
      e.preventDefault();
      const status = document.getElementById('editStatus').value;
      const bookingDate = document.getElementById('editDate').value;
      const startTime = document.getElementById('editStartTime').value;
      const endTime = document.getElementById('editEndTime').value;
      let playerDetails;
      try {
        playerDetails = JSON.parse(document.getElementById('editPlayerDetails').value);
      } catch (err) {
        alert('Player Details must be valid JSON');
        return;
      }
      const update = {
        status,
        bookingDate,
        timeSlot: { startTime, endTime },
        playerDetails
      };
      try {
        const response = await fetch(`${BASE_API_URL}/api/admin/bookings/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(update)
        });
        const data = await response.json();
        if (data.success) {
          alert('Booking updated!');
          document.getElementById('bookingModal').style.display = 'none';
          loadBookings();
        } else {
          alert('Error updating booking: ' + (data.message || ''));
        }
      } catch (err) {
        alert('Error updating booking: ' + err.message);
      }
    };
    document.getElementById('cancelEditBtn').onclick = function() {
      window.viewBooking(id);
    };
  };
  document.getElementById('deleteBookingBtn').onclick = function() {
    document.getElementById('bookingModal').style.display = 'none';
    document.getElementById('deleteBookingModal').style.display = 'block';
  };
};

window.closeBookingModal = function() {
  document.getElementById('bookingModal').style.display = 'none';
};

// Delete Booking
window.showDeleteBookingModal = function(id) {
  selectedBookingId = id;
  document.getElementById('deleteBookingModal').style.display = 'block';
};

window.closeDeleteBookingModal = function() {
  document.getElementById('deleteBookingModal').style.display = 'none';
};

document.getElementById('confirmDeleteBookingBtn').onclick = async function() {
  if (!selectedBookingId) return;
  try {
    const response = await fetch(`${BASE_API_URL}/api/admin/bookings/${selectedBookingId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) {
      alert('Booking deleted successfully!');
      document.getElementById('deleteBookingModal').style.display = 'none';
      loadBookings();
    } else {
      alert('Error deleting booking: ' + (data.message || ''));
    }
  } catch (err) {
    alert('Error deleting booking: ' + err.message);
  }
};