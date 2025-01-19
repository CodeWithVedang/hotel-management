// scripts/invoice.js
import { auth, db, collection, getDocs, signOut } from '../firebase-config.js';

// DOM Elements
const logoutBtn = document.getElementById('logout-btn');
const invoiceBookingId = document.getElementById('invoice-booking-id');
const invoiceGuestName = document.getElementById('invoice-guest-name');
const invoiceRoomNumber = document.getElementById('invoice-room-number');
const invoiceCheckInDate = document.getElementById('invoice-check-in-date');
const invoiceCheckOutDate = document.getElementById('invoice-check-out-date');
const invoiceTotalAmount = document.getElementById('invoice-total-amount');
const invoicePaymentMethod = document.getElementById('invoice-payment-method');
const invoicePaymentDate = document.getElementById('invoice-payment-date');

// Fetch Invoice Details from URL Parameters
const urlParams = new URLSearchParams(window.location.search);
const bookingId = urlParams.get('bookingId');

// Load Invoice Details
async function loadInvoice() {
  try {
    const invoiceQuery = await getDocs(collection(db, 'invoices'));
    invoiceQuery.forEach((doc) => {
      const invoice = doc.data();
      if (invoice.bookingId === bookingId) {
        invoiceBookingId.textContent = invoice.bookingId;
        invoiceGuestName.textContent = invoice.guestName;
        invoiceRoomNumber.textContent = invoice.roomNumber;
        invoiceCheckInDate.textContent = invoice.checkInDate;
        invoiceCheckOutDate.textContent = invoice.checkOutDate;
        invoiceTotalAmount.textContent = `$${invoice.totalAmount}`;
        invoicePaymentMethod.textContent = invoice.paymentMethod;
        invoicePaymentDate.textContent = invoice.paymentDate;
      }
    });
  } catch (error) {
    alert('Error loading invoice: ' + error.message);
  }
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

// Load invoice on page load
loadInvoice();