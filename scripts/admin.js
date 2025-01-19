// scripts/admin.js
import {
  auth,
  db,
  collection,
  addDoc,
  signOut,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
} from '../firebase-config.js';

// DOM Elements
const addHotelForm = document.getElementById('add-hotel-form');
const addRoomForm = document.getElementById('add-room-form');
const logoutBtn = document.getElementById('logout-btn');
const roomCardsContainer = document.getElementById('room-cards');
const editRoomForm = document.getElementById('edit-room-form');
const editRoomNumberInput = document.getElementById('edit-room-number');
const editRoomTypeInput = document.getElementById('edit-room-type');
const editRoomPriceInput = document.getElementById('edit-room-price');
const editRoomAmenitiesInput = document.getElementById('edit-room-amenities');
const cancelEditBtn = document.getElementById('cancel-edit');
const hotelSelect = document.getElementById('hotel-select');

let hotelId = null; // Store the selected hotelId for room management

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

// Check if the user is an admin
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Fetch user role from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Allow access only if the user is an admin
      if (userData.role === 'admin') {
        loadHotels(); // Load hotels for the admin to select
      } else {
        // Redirect non-admin users to another page (e.g., index.html)
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

// Load Hotels for the Admin to Select
async function loadHotels() {
  try {
    const querySnapshot = await getDocs(collection(db, 'hotels'));
    hotelSelect.innerHTML = '<option value="">Select Hotel</option>';

    querySnapshot.forEach((doc) => {
      const hotel = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = hotel.name;
      hotelSelect.appendChild(option);
    });
  } catch (error) {
    alert('Error loading hotels: ' + error.message);
  }
}

// Handle Hotel Selection
hotelSelect.addEventListener('change', (e) => {
  hotelId = e.target.value;
  if (hotelId) {
    loadRooms(); // Load rooms for the selected hotel
  } else {
    alert('Please select a hotel.');
  }
});

// Add Hotel
if (addHotelForm) {
  addHotelForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    const hotelName = document.getElementById('hotel-name').value;
    const hotelAddress = document.getElementById('hotel-address').value;
    const hotelPhone = document.getElementById('hotel-phone').value;

    try {
      // Add hotel to Firestore
      await addDoc(collection(db, 'hotels'), {
        name: hotelName,
        address: hotelAddress,
        phone: hotelPhone,
      });

      alert('Hotel added successfully!');
      addHotelForm.reset();
      loadHotels(); // Refresh the hotel list
    } catch (error) {
      alert('Error adding hotel: ' + error.message);
    }
  });
}

// Add Room
if (addRoomForm) {
  addRoomForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    const roomNumber = document.getElementById('room-number').value;
    const roomType = document.getElementById('room-type').value;
    const roomPrice = document.getElementById('room-price').value;
    const roomAmenities = document.getElementById('room-amenities').value;

    if (!hotelId) {
      alert('Please select a hotel before adding a room.');
      return;
    }

    try {
      // Add room to Firestore with hotelId
      await addDoc(collection(db, 'rooms'), {
        roomNumber,
        roomType,
        roomPrice,
        roomAmenities,
        status: 'available', // Default status
        hotelId, // Associate the room with the selected hotel
      });

      alert('Room added successfully!');
      addRoomForm.reset();
      loadRooms(); // Refresh the room list
    } catch (error) {
      alert('Error adding room: ' + error.message);
    }
  });
}

// Load Rooms for the Selected Hotel
async function loadRooms() {
  try {
    if (!hotelId) {
      alert('No hotel selected. Cannot load rooms.');
      return;
    }

    // Query rooms for the selected hotel
    const roomsQuery = query(collection(db, 'rooms'), where('hotelId', '==', hotelId));
    const querySnapshot = await getDocs(roomsQuery);
    roomCardsContainer.innerHTML = ''; // Clear the container

    querySnapshot.forEach((doc) => {
      const room = doc.data();
      const card = document.createElement('div');
      card.className = 'room-card';

      card.innerHTML = `
        <h3>Room ${room.roomNumber}</h3>
        <p><strong>Type:</strong> ${room.roomType}</p>
        <p><strong>Price:</strong> $${room.roomPrice}/night</p>
        <p><strong>Amenities:</strong> ${room.roomAmenities}</p>
        <p class="status"><strong>Status:</strong> ${room.status}</p>
        <div class="actions">
          <button class="edit" onclick="openEditForm('${room.roomNumber}')">Edit</button>
          <button class="delete" onclick="deleteRoom('${room.roomNumber}')">Delete</button>
        </div>
      `;

      roomCardsContainer.appendChild(card);
    });
  } catch (error) {
    alert('Error loading rooms: ' + error.message);
  }
}

// Open Edit Form
window.openEditForm = async (roomNumber) => {
  try {
    // Fetch the room details from Firestore
    const roomDoc = await getDoc(doc(db, 'rooms', roomNumber));
    if (roomDoc.exists()) {
      const room = roomDoc.data();

      // Populate the edit form
      editRoomNumberInput.value = room.roomNumber;
      editRoomTypeInput.value = room.roomType;
      editRoomPriceInput.value = room.roomPrice;
      editRoomAmenitiesInput.value = room.roomAmenities;

      // Show the edit form
      editRoomForm.style.display = 'block';
      addRoomForm.style.display = 'none';
    } else {
      alert('Room not found!');
    }
  } catch (error) {
    alert('Error loading room details: ' + error.message);
  }
};

// Update Room
if (document.getElementById('edit-room')) {
  document.getElementById('edit-room').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    const roomNumber = editRoomNumberInput.value;
    const roomType = editRoomTypeInput.value;
    const roomPrice = editRoomPriceInput.value;
    const roomAmenities = editRoomAmenitiesInput.value;

    try {
      // Update room in Firestore
      await updateDoc(doc(db, 'rooms', roomNumber), {
        roomType,
        roomPrice,
        roomAmenities,
      });

      alert('Room updated successfully!');
      editRoomForm.style.display = 'none';
      addRoomForm.style.display = 'block';
      loadRooms(); // Refresh the room list
    } catch (error) {
      alert('Error updating room: ' + error.message);
    }
  });
}

// Cancel Edit
if (cancelEditBtn) {
  cancelEditBtn.addEventListener('click', () => {
    editRoomForm.style.display = 'none';
    addRoomForm.style.display = 'block';
  });
}

// Delete Room
window.deleteRoom = async (roomNumber) => {
  if (confirm('Are you sure you want to delete this room?')) {
    try {
      await deleteDoc(doc(db, 'rooms', roomNumber));
      alert('Room deleted successfully!');
      loadRooms(); // Refresh the room list
    } catch (error) {
      alert('Error deleting room: ' + error.message);
    }
  }
};