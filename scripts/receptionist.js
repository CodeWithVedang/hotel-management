// scripts/receptionist.js
import { auth, db, collection, getDocs, doc, updateDoc, signOut, getDoc, query, where } from '../firebase-config.js';

// DOM Elements
const bookingTableBody = document.querySelector('#booking-table tbody');
const logoutBtn = document.getElementById('logout-btn');
const editPaymentForm = document.getElementById('edit-payment-form');
const editBookingIdInput = document.getElementById('edit-booking-id');
const editPaymentStatusSelect = document.getElementById('edit-payment-status');
const cancelEditBtn = document.getElementById('cancel-edit');
const manageInventoryBtn = document.getElementById('manage-inventory-btn');

let hotelId = null; // Store the hotelId for the current user

// Logout Functionality
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userRole'); // Clear role from localStorage
      localStorage.removeItem('userId'); // Clear user ID from localStorage
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
    // Fetch user role and hotelId from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Allow access only if the user is a receptionist
      if (userData.role === 'receptionist') {
        hotelId = userData.hotelId; // Set the hotelId for the current user
        initReceptionistManagement();
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

// Initialize Receptionist Management
function initReceptionistManagement() {
  // Load Bookings
  async function loadBookings() {
    try {
      // Query bookings for the current hotel
      const bookingsQuery = query(collection(db, 'bookings'), where('hotelId', '==', hotelId));
      const querySnapshot = await getDocs(bookingsQuery);
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
          <td>${booking.paymentStatus || 'pending'}</td>
          <td class="actions">
            <button class="edit" onclick="openEditPaymentForm('${doc.id}', '${booking.paymentStatus || 'pending'}')">Update Payment</button>
          </td>
        `;

        bookingTableBody.appendChild(row);
      });
    } catch (error) {
      alert('Error loading bookings: ' + error.message);
    }
  }

  // Open Edit Payment Form
  window.openEditPaymentForm = (bookingId, paymentStatus) => {
    // Populate the edit form
    editBookingIdInput.value = bookingId;
    editPaymentStatusSelect.value = paymentStatus;

    // Show the edit form
    editPaymentForm.style.display = 'block';
  };

  // Update Payment Status
  if (editPaymentForm) {
    editPaymentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const bookingId = editBookingIdInput.value;
      const paymentStatus = editPaymentStatusSelect.value;

      try {
        // Update payment status in Firestore
        await updateDoc(doc(db, 'bookings', bookingId), {
          paymentStatus
        });

        alert('Payment status updated successfully!');
        editPaymentForm.style.display = 'none'; // Hide the edit form
        loadBookings(); // Refresh the booking list
      } catch (error) {
        alert('Error updating payment status: ' + error.message);
      }
    });
  }

  // Cancel Edit
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      editPaymentForm.style.display = 'none'; // Hide the edit form
    });
  }

  // Redirect to Inventory Management Page
  if (manageInventoryBtn) {
    manageInventoryBtn.addEventListener('click', () => {
      window.location.href = 'inventory.html';
    });
  }

  // Load bookings on page load
  loadBookings();
}