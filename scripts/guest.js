// scripts/guest.js
import { auth, db, collection, addDoc, getDocs, signOut, doc, getDoc, query, where } from '../firebase-config.js';

// DOM Elements
const bookingForm = document.getElementById('booking-form');
const roomNumberSelect = document.getElementById('room-number');
const logoutBtn = document.getElementById('logout-btn');
const guestEmailInput = document.getElementById('guest-email');
const bookingTableBody = document.querySelector('#booking-table tbody');
const roomDetailsSection = document.getElementById('room-details');

let hotelId = localStorage.getItem('selectedHotelId'); // Get the selected hotel ID from localStorage

if (!hotelId) {
  alert('No hotel selected. Please select a hotel before proceeding.');
  window.location.href = 'index.html'; // Redirect to the hotel selection page
}

// Fetch Current User and Populate Email
auth.onAuthStateChanged((user) => {
  if (user) {
    // Populate the email field with the logged-in user's email
    guestEmailInput.value = user.email;

    // Fetch user role and hotelId from Firestore
    getDoc(doc(db, 'users', user.uid)).then((doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        hotelId = userData.hotelId; // Set the hotelId for the current user
        console.log("User's Hotel ID:", hotelId); // Debugging
        loadRooms();
        loadBookings(user.email);
      }
    });
  }
});

// Load Rooms for Booking
async function loadRooms() {
  try {
    // Query rooms for the current hotel
    const roomsQuery = query(collection(db, 'rooms'), where('hotelId', '==', hotelId));
    const querySnapshot = await getDocs(roomsQuery);
    console.log("Rooms Query Results:", querySnapshot.docs.map(doc => doc.data())); // Debugging
    roomNumberSelect.innerHTML = '<option value="">Select Room</option>';

    querySnapshot.forEach((doc) => {
      const room = doc.data();
      const option = document.createElement('option');
      option.value = room.roomNumber; // Use the roomNumber field as the value
      option.textContent = `Room ${room.roomNumber} (${room.roomType}) - $${room.roomPrice}/night`;
      roomNumberSelect.appendChild(option);
    });

    // Add event listener to show room details when a room is selected
    roomNumberSelect.addEventListener('change', async (e) => {
      const selectedRoomNumber = e.target.value;
      if (selectedRoomNumber) {
        await showRoomDetails(selectedRoomNumber);
      } else {
        roomDetailsSection.innerHTML = ''; // Clear room details if no room is selected
      }
    });
  } catch (error) {
    alert('Error loading rooms: ' + error.message);
  }
}

// Show Room Details
async function showRoomDetails(roomNumber) {
  try {
    // Query the rooms collection to find the document where roomNumber matches
    const roomsQuery = query(collection(db, 'rooms'), where('roomNumber', '==', roomNumber), where('hotelId', '==', hotelId));
    const querySnapshot = await getDocs(roomsQuery);

    if (!querySnapshot.empty) {
      // Get the first document (there should only be one document with this roomNumber)
      const roomDoc = querySnapshot.docs[0];
      const room = roomDoc.data();

      // Display room details in the room-details section
      roomDetailsSection.innerHTML = `
        <p><strong>Room Number:</strong> ${room.roomNumber}</p>
        <p><strong>Type:</strong> ${room.roomType}</p>
        <p><strong>Price:</strong> $${room.roomPrice}/night</p>
        <p><strong>Amenities:</strong> ${room.roomAmenities}</p>
        <p><strong>Status:</strong> ${room.status}</p>
      `;
    } else {
      // If no document is found, display a message
      roomDetailsSection.innerHTML = '<p>Room details not found.</p>';
    }
  } catch (error) {
    // Handle any errors that occur during the fetch
    alert('Error fetching room details: ' + error.message);
    roomDetailsSection.innerHTML = '<p>Error loading room details.</p>';
  }
}

// Add Booking
if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const guestName = document.getElementById('guest-name').value;
    const guestEmail = guestEmailInput.value; // Use the logged-in user's email
    const roomNumber = document.getElementById('room-number').value;
    const checkInDate = document.getElementById('check-in-date').value;
    const checkOutDate = document.getElementById('check-out-date').value;

    try {
      // Fetch room details to get the price
      const roomQuery = query(collection(db, 'rooms'), where('roomNumber', '==', roomNumber), where('hotelId', '==', hotelId));
      const roomSnapshot = await getDocs(roomQuery);
      let roomPrice = 0;

      if (!roomSnapshot.empty) {
        const room = roomSnapshot.docs[0].data();
        roomPrice = room.roomPrice;
      }

      // Calculate total amount (for simplicity, assume 1 night = 1 day)
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const totalAmount = roomPrice * nights;

      // Add booking to Firestore with hotelId
      await addDoc(collection(db, 'bookings'), {
        roomNumber,
        roomPrice,
        guestName,
        guestEmail,
        checkInDate,
        checkOutDate,
        totalAmount,
        paymentStatus: 'pending',
        hotelId // Associate the booking with the hotel
      });

      alert('Booking request sent successfully!');
      bookingForm.reset();
      loadBookings(guestEmail); // Refresh the booking list
    } catch (error) {
      alert('Error adding booking: ' + error.message);
    }
  });
}

// Load Bookings for the Current User
async function loadBookings(guestEmail) {
  try {
    // Query bookings for the current hotel and guest
    const bookingsQuery = query(collection(db, 'bookings'), where('hotelId', '==', hotelId), where('guestEmail', '==', guestEmail));
    const querySnapshot = await getDocs(bookingsQuery);
    bookingTableBody.innerHTML = ''; // Clear the table

    querySnapshot.forEach((doc) => {
      const booking = doc.data();
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>${booking.roomNumber}</td>
        <td>${booking.checkInDate}</td>
        <td>${booking.checkOutDate}</td>
        <td>${booking.paymentStatus || 'pending'}</td>
        <td class="actions">
          ${booking.paymentStatus === 'pending' ? `<button class="pay" onclick="payBooking('${doc.id}', ${booking.totalAmount})">Pay Now</button>` : ''}
          ${booking.paymentStatus === 'completed' ? `<button class="view-invoice" onclick="viewInvoice('${doc.id}')">View Invoice</button>` : ''}
        </td>
      `;

      bookingTableBody.appendChild(row);
    });
  } catch (error) {
    alert('Error loading bookings: ' + error.message);
  }
}

// Redirect to Payment Page
window.payBooking = (bookingId, totalAmount) => {
  window.location.href = `payment.html?bookingId=${encodeURIComponent(bookingId)}&totalAmount=${encodeURIComponent(totalAmount)}`;
};

// Redirect to Invoice Page
window.viewInvoice = (bookingId) => {
  window.location.href = `invoice.html?bookingId=${encodeURIComponent(bookingId)}`;
};

// Logout Functionality
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      alert('Logged out successfully!');
      window.location.href = 'index.html'; // Redirect to login page
    } catch (error) {
      alert('Error logging out: ' + error.message);
    }
  });
}