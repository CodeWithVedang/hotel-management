// scripts/billing.js
import { auth, db, collection, addDoc, signOut } from '../firebase-config.js';

// DOM Elements
const logoutBtn = document.getElementById('logout-btn');
const paymentForm = document.getElementById('payment-form');
const guestNameInput = document.getElementById('guest-name');
const guestEmailInput = document.getElementById('guest-email');
const roomNumberInput = document.getElementById('room-number');
const checkInDateInput = document.getElementById('check-in-date');
const checkOutDateInput = document.getElementById('check-out-date');
const totalAmountInput = document.getElementById('total-amount');

// Fetch Booking Details from URL Parameters
const urlParams = new URLSearchParams(window.location.search);
const guestName = urlParams.get('guestName');
const guestEmail = urlParams.get('guestEmail');
const roomNumber = urlParams.get('roomNumber');
const checkInDate = urlParams.get('checkInDate');
const checkOutDate = urlParams.get('checkOutDate');
const totalAmount = urlParams.get('totalAmount');

// Populate Form Fields
if (guestName && guestEmail && roomNumber && checkInDate && checkOutDate && totalAmount) {
  guestNameInput.value = guestName;
  guestEmailInput.value = guestEmail;
  roomNumberInput.value = roomNumber;
  checkInDateInput.value = checkInDate;
  checkOutDateInput.value = checkOutDate;
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
      // Add payment to Firestore
      await addDoc(collection(db, 'payments'), {
        guestName,
        guestEmail,
        roomNumber,
        checkInDate,
        checkOutDate,
        totalAmount,
        paymentMethod,
        paymentStatus: 'completed',
        paymentDate: new Date().toISOString()
      });

      alert('Payment successful!');
      window.location.href = 'guest.html'; // Redirect to guest page
    } catch (error) {
      alert('Error processing payment: ' + error.message);
    }
  });
}