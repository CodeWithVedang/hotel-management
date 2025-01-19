// scripts/payment.js
import { auth, db, collection, addDoc, doc, getDoc, updateDoc, signOut } from '../firebase-config.js';

// DOM Elements
const logoutBtn = document.getElementById('logout-btn');
const paymentForm = document.getElementById('payment-form');
const bookingIdInput = document.getElementById('booking-id');
const totalAmountInput = document.getElementById('total-amount');

// Fetch Booking Details from URL Parameters
const urlParams = new URLSearchParams(window.location.search);
const bookingId = urlParams.get('bookingId');
const totalAmount = urlParams.get('totalAmount');

// Populate Form Fields
if (bookingId && totalAmount) {
  bookingIdInput.value = bookingId;
  totalAmountInput.value = totalAmount;
}

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

// Process Payment
if (paymentForm) {
  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const paymentMethod = document.getElementById('payment-method').value;

    try {
      // Update payment status in Firestore
      await updateDoc(doc(db, 'bookings', bookingId), {
        paymentStatus: 'completed',
        paymentMethod,
        paymentDate: new Date().toISOString()
      });

      // Generate Invoice
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      const booking = bookingDoc.data();

      await addDoc(collection(db, 'invoices'), {
        bookingId,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        roomNumber: booking.roomNumber,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        totalAmount: booking.totalAmount,
        paymentMethod,
        paymentDate: new Date().toISOString()
      });

      alert('Payment successful!');
      window.location.href = 'guest.html'; // Redirect to guest page
    } catch (error) {
      alert('Error processing payment: ' + error.message);
    }
  });
}