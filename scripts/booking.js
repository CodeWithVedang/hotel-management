// scripts/booking.js
import { auth, db, collection, addDoc, getDocs, doc, updateDoc, signOut, getDoc } from '../firebase-config.js';

// DOM Elements
const bookingForm = document.getElementById('booking-form');
const bookingTableBody = document.querySelector('#booking-table tbody');
const logoutBtn = document.getElementById('logout-btn');
const roomNumberSelect = document.getElementById('room-number');

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

// Check if the user is a receptionist
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Fetch user role from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Allow access only if the user is a receptionist
      if (userData.role === 'receptionist') {
        initBookingManagement();
      } else {
        // Redirect non-receptionist users to another page (e.g., index.html)
        alert('You do not have permission to access this page.');
        await signOut(auth);
        window.location.href = 'index.html';
      }
    }
  } else {
    // Redirect to login page if the user is not logged in
    window.location.href = 'index.html';
  }
});

// Initialize Booking Management
function initBookingManagement() {
  // Load Rooms for Booking
  async function loadRooms() {
    try {
      const querySnapshot = await getDocs(collection(db, 'rooms'));
      roomNumberSelect.innerHTML = '<option value="">Select Room</option>';

      querySnapshot.forEach((doc) => {
        const room = doc.data();
        const option = document.createElement('option');
        option.value = room.roomNumber;
        option.textContent = `Room ${room.roomNumber} (${room.roomType})`;
        roomNumberSelect.appendChild(option);
      });
    } catch (error) {
      alert('Error loading rooms: ' + error.message);
    }
  }

  // Add Booking
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const guestName = document.getElementById('guest-name').value;
    const guestEmail = document.getElementById('guest-email').value;
    const roomNumber = document.getElementById('room-number').value;
    const checkInDate = document.getElementById('check-in-date').value;
    const checkOutDate = document.getElementById('check-out-date').value;

    try {
      // Add booking to Firestore
      const bookingRef = await addDoc(collection(db, 'bookings'), {
        roomNumber,
        guestName,
        guestEmail,
        checkInDate,
        checkOutDate,
        status: 'pending'
      });

      alert('Booking added successfully!');
      bookingForm.reset();
      loadBookings(); // Refresh the booking list
    } catch (error) {
      alert('Error adding booking: ' + error.message);
    }
  });

  // Load Bookings
  async function loadBookings() {
    try {
      const querySnapshot = await getDocs(collection(db, 'bookings'));
      bookingTableBody.innerHTML = ''; // Clear the table

      querySnapshot.forEach((doc) => {
        const booking = doc.data();
        const row = document.createElement('tr');

        row.innerHTML = `
          <td>${doc.id}</td>
          <td>${booking.roomNumber}</td>
          <td>${booking.guestName}</td>
          <td>${booking.checkInDate}</td>
          <td>${booking.checkOutDate}</td>
          <td>${booking.status}</td>
          <td class="actions">
            <button class="confirm" onclick="confirmBooking('${doc.id}')">Confirm</button>
            <button class="cancel" onclick="cancelBooking('${doc.id}')">Cancel</button>
          </td>
        `;

        bookingTableBody.appendChild(row);
      });
    } catch (error) {
      alert('Error loading bookings: ' + error.message);
    }
  }

  // Confirm Booking
  window.confirmBooking = async (bookingId) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'confirmed'
      });
      alert('Booking confirmed!');
      loadBookings(); // Refresh the booking list
    } catch (error) {
      alert('Error confirming booking: ' + error.message);
    }
  };

  // Cancel Booking
  window.cancelBooking = async (bookingId) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'canceled'
        });
        alert('Booking canceled!');
        loadBookings(); // Refresh the booking list
      } catch (error) {
        alert('Error canceling booking: ' + error.message);
      }
    }
  };

  // Load rooms and bookings on page load
  loadRooms();
  loadBookings();
}