// scripts/room.js
import { auth, db, doc, setDoc, getDocs, collection, deleteDoc, updateDoc, getDoc, signOut } from '../firebase-config.js';

// DOM Elements
const addRoomForm = document.getElementById('add-room-form');
const editRoomForm = document.getElementById('edit-room-form');
const roomTableBody = document.querySelector('#room-table tbody');
const logoutBtn = document.getElementById('logout-btn');

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

// Check if the user is an admin
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Fetch user role from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Allow access only if the user is an admin
      if (userData.role === 'admin') {
        initRoomManagement();
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

// Initialize Room Management
function initRoomManagement() {
  // Add Room
  addRoomForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const roomNumber = document.getElementById('room-number').value;
    const roomType = document.getElementById('room-type').value;
    const roomPrice = document.getElementById('room-price').value;
    const roomAmenities = document.getElementById('room-amenities').value;

    try {
      // Add room to Firestore
      await setDoc(doc(db, 'rooms', roomNumber), {
        roomNumber,
        roomType,
        roomPrice,
        roomAmenities,
        status: 'available' // Default status
      });

      alert('Room added successfully!');
      addRoomForm.reset();
      loadRooms(); // Refresh the room list
    } catch (error) {
      alert('Error adding room: ' + error.message);
    }
  });

  // Load Rooms
  async function loadRooms() {
    try {
      const querySnapshot = await getDocs(collection(db, 'rooms'));
      roomTableBody.innerHTML = ''; // Clear the table

      querySnapshot.forEach((doc) => {
        const room = doc.data();
        const row = document.createElement('tr');

        row.innerHTML = `
          <td>${room.roomNumber}</td>
          <td>${room.roomType}</td>
          <td>$${room.roomPrice}</td>
          <td>${room.roomAmenities}</td>
          <td>${room.status}</td>
          <td class="actions">
            <button class="edit" onclick="openEditForm('${room.roomNumber}')">Edit</button>
            <button class="delete" onclick="deleteRoom('${room.roomNumber}')">Delete</button>
          </td>
        `;

        roomTableBody.appendChild(row);
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
        document.getElementById('edit-room-number').value = room.roomNumber;
        document.getElementById('edit-room-type').value = room.roomType;
        document.getElementById('edit-room-price').value = room.roomPrice;
        document.getElementById('edit-room-amenities').value = room.roomAmenities;

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
  document.getElementById('edit-room').addEventListener('submit', async (e) => {
    e.preventDefault();

    const roomNumber = document.getElementById('edit-room-number').value;
    const roomType = document.getElementById('edit-room-type').value;
    const roomPrice = document.getElementById('edit-room-price').value;
    const roomAmenities = document.getElementById('edit-room-amenities').value;

    try {
      // Update room in Firestore
      await updateDoc(doc(db, 'rooms', roomNumber), {
        roomType,
        roomPrice,
        roomAmenities
      });

      alert('Room updated successfully!');
      editRoomForm.style.display = 'none';
      addRoomForm.style.display = 'block';
      loadRooms(); // Refresh the room list
    } catch (error) {
      alert('Error updating room: ' + error.message);
    }
  });

  // Cancel Edit
  document.getElementById('cancel-edit').addEventListener('click', () => {
    editRoomForm.style.display = 'none';
    addRoomForm.style.display = 'block';
  });

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

  // Load rooms on page load
  loadRooms();
}