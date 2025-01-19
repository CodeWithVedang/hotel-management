// scripts/auth.js
import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, doc, setDoc, getDoc, collection, getDocs, updateDoc } from '../firebase-config.js';

// DOM Elements
const hotelSelectionForm = document.getElementById('hotel-selection-form');
const hotelList = document.getElementById('hotel-list');
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const profileSection = document.getElementById('profile-section');
const registerBtn = document.getElementById('register-btn');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const registerLink = document.getElementById('register-link');
const loginLink = document.getElementById('login-link');
const selectHotelBtn = document.getElementById('select-hotel-btn');

// Load Hotels
async function loadHotels() {
  try {
    const querySnapshot = await getDocs(collection(db, 'hotels'));
    hotelList.innerHTML = '<option value="">Select Hotel</option>';

    querySnapshot.forEach((doc) => {
      const hotel = doc.data();
      const option = document.createElement('option');
      option.value = doc.id; // Use the document ID as the value
      option.textContent = hotel.name; // Use the hotel name as the display text
      hotelList.appendChild(option);
    });
  } catch (error) {
    alert('Error loading hotels: ' + error.message);
  }
}

// Select Hotel
if (selectHotelBtn) {
  selectHotelBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const selectedHotelId = hotelList.value;

    if (selectedHotelId) {
      // Store the selected hotel ID in localStorage
      localStorage.setItem('selectedHotelId', selectedHotelId);
      console.log("Selected Hotel ID stored in localStorage:", selectedHotelId); // Debugging

      // Update the user's hotelId in Firestore if the user is logged in
      const user = auth.currentUser;
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            hotelId: selectedHotelId,
          });
          console.log("User's hotelId updated in Firestore:", selectedHotelId); // Debugging
        } catch (error) {
          console.error("Error updating user's hotelId:", error); // Debugging
        }
      }

      alert('Hotel selected successfully!');

      // Hide the hotel selection form and show the login form
      hotelSelectionForm.style.display = 'none';
      loginForm.style.display = 'block';
    } else {
      alert('Please select a hotel.');
    }
  });
}

// Register a new user
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    const selectedHotelId = localStorage.getItem('selectedHotelId'); // Get the selected hotel ID

    if (!selectedHotelId) {
      alert('No hotel selected. Please select a hotel before registering.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("User UID:", user.uid); // Debugging
      console.log("User Data:", { name, email, role, hotelId: selectedHotelId }); // Debugging

      // Save user details in Firestore, including the selected hotel ID
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        role,
        hotelId: selectedHotelId, // Associate the user with the selected hotel
      });

      console.log("User details saved to Firestore."); // Debugging
      alert('Registration successful!');
      showProfile({ name, email, role });
    } catch (error) {
      console.error("Error during registration:", error); // Debugging
      alert(error.message);
    }
  });
}

// Login an existing user
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user details from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Update the user's hotelId in Firestore if a new hotel is selected
        const selectedHotelId = localStorage.getItem('selectedHotelId');
        if (selectedHotelId && selectedHotelId !== userData.hotelId) {
          await updateDoc(doc(db, 'users', user.uid), {
            hotelId: selectedHotelId,
          });
          console.log("User's hotelId updated in Firestore:", selectedHotelId); // Debugging
        }

        // Redirect based on role
        if (userData.role === 'admin') {
          window.location.href = 'admin.html';
        } else if (userData.role === 'receptionist') {
          window.location.href = 'receptionist.html';
        } else if (userData.role === 'guest') {
          window.location.href = 'guest.html';
        }
      }
    } catch (error) {
      alert(error.message);
    }
  });
}

// Logout the user
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      alert('Logged out successfully!');
      window.location.href = 'index.html';
    } catch (error) {
      alert(error.message);
    }
  });
}

// Show profile section (for guests)
function showProfile(user) {
  if (registerForm && loginForm && profileSection) {
    registerForm.style.display = 'none';
    loginForm.style.display = 'none';
    profileSection.style.display = 'block';

    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-role').textContent = user.role;
  }
}

// Switch between Register and Login forms
if (registerLink && loginLink) {
  registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
  });

  loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  });
}

// Check if user is already logged in
auth.onAuthStateChanged((user) => {
  if (user) {
    getDoc(doc(db, 'users', user.uid)).then((doc) => {
      if (doc.exists()) {
        const userData = doc.data();

        // Update the user's hotelId in Firestore if a new hotel is selected
        const selectedHotelId = localStorage.getItem('selectedHotelId');
        if (selectedHotelId && selectedHotelId !== userData.hotelId) {
          updateDoc(doc(db, 'users', user.uid), {
            hotelId: selectedHotelId,
          }).then(() => {
            console.log("User's hotelId updated in Firestore:", selectedHotelId); // Debugging
          }).catch((error) => {
            console.error("Error updating user's hotelId:", error); // Debugging
          });
        }

        // Redirect based on role
        if (userData.role === 'admin') {
          window.location.href = 'admin.html';
        } else if (userData.role === 'receptionist') {
          window.location.href = 'receptionist.html';
        } else if (userData.role === 'guest') {
          window.location.href = 'guest.html';
        }
      }
    });
  } else {
    // Show hotel selection form if user is not logged in
    hotelSelectionForm.style.display = 'block';
    registerForm.style.display = 'none';
    loginForm.style.display = 'none';
    profileSection.style.display = 'none';
    loadHotels();
  }
});