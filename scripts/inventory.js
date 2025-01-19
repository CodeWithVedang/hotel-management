// scripts/inventory.js
import { auth, db, signOut, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from '../firebase-config.js';

// DOM Elements
const addInventoryForm = document.getElementById('add-inventory-form');
const inventoryTableBody = document.querySelector('#inventory-table tbody');
const logoutBtn = document.getElementById('logout-btn');
const addVendorForm = document.getElementById('add-vendor-form');
const vendorTableBody = document.querySelector('#vendor-table tbody');

// Check if the user is a receptionist
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Fetch user role from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Allow access only if the user is a receptionist
      if (userData.role === 'receptionist') {
        initInventoryManagement();
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

// Initialize Inventory Management
function initInventoryManagement() {
  // Add Inventory Item
  addInventoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemName = document.getElementById('item-name').value;
    const itemCategory = document.getElementById('item-category').value;
    const itemQuantity = document.getElementById('item-quantity').value;
    const itemThreshold = document.getElementById('item-threshold').value;
    const itemVendor = document.getElementById('item-vendor').value;

    try {
      await addDoc(collection(db, 'inventory'), {
        name: itemName,
        category: itemCategory,
        quantity: parseInt(itemQuantity),
        threshold: parseInt(itemThreshold),
        vendor: itemVendor,
        status: itemQuantity <= itemThreshold ? 'Low Stock' : 'In Stock'
      });
      alert('Inventory item added successfully!');
      addInventoryForm.reset();
      loadInventory();
    } catch (error) {
      console.error('Error adding inventory item:', error);
    }
  });

  // Load Inventory Items
  const loadInventory = async () => {
    inventoryTableBody.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, 'inventory'));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = `
        <tr>
          <td>${data.name}</td>
          <td>${data.category}</td>
          <td>${data.quantity}</td>
          <td>${data.threshold}</td>
          <td>${data.vendor}</td>
          <td>${data.status}</td>
          <td>
            <button onclick="editInventory('${doc.id}')">Edit</button>
            <button onclick="deleteInventory('${doc.id}')">Delete</button>
          </td>
        </tr>
      `;
      inventoryTableBody.innerHTML += row;
    });
  };

  // Edit Inventory Item
  window.editInventory = async (id) => {
    const docRef = doc(db, 'inventory', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('edit-item-name').value = data.name;
      document.getElementById('edit-item-category').value = data.category;
      document.getElementById('edit-item-quantity').value = data.quantity;
      document.getElementById('edit-item-threshold').value = data.threshold;
      document.getElementById('edit-item-vendor').value = data.vendor;
      document.getElementById('edit-inventory-form').style.display = 'block';
      document.getElementById('edit-inventory').onsubmit = async (e) => {
        e.preventDefault();
        await updateDoc(docRef, {
          name: document.getElementById('edit-item-name').value,
          category: document.getElementById('edit-item-category').value,
          quantity: parseInt(document.getElementById('edit-item-quantity').value),
          threshold: parseInt(document.getElementById('edit-item-threshold').value),
          vendor: document.getElementById('edit-item-vendor').value,
          status: document.getElementById('edit-item-quantity').value <= document.getElementById('edit-item-threshold').value ? 'Low Stock' : 'In Stock'
        });
        alert('Inventory item updated successfully!');
        document.getElementById('edit-inventory-form').style.display = 'none';
        loadInventory();
      };
    }
  };

  // Delete Inventory Item
  window.deleteInventory = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteDoc(doc(db, 'inventory', id));
      alert('Inventory item deleted successfully!');
      loadInventory();
    }
  };

  // Add Vendor
  addVendorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const vendorName = document.getElementById('vendor-name').value;
    const vendorContact = document.getElementById('vendor-contact').value;
    const vendorAddress = document.getElementById('vendor-address').value;

    try {
      await addDoc(collection(db, 'vendors'), {
        name: vendorName,
        contact: vendorContact,
        address: vendorAddress
      });
      alert('Vendor added successfully!');
      addVendorForm.reset();
      loadVendors();
    } catch (error) {
      console.error('Error adding vendor:', error);
    }
  });

  // Load Vendors
  const loadVendors = async () => {
    vendorTableBody.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, 'vendors'));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = `
        <tr>
          <td>${data.name}</td>
          <td>${data.contact}</td>
          <td>${data.address}</td>
          <td>
            <button onclick="deleteVendor('${doc.id}')">Delete</button>
          </td>
        </tr>
      `;
      vendorTableBody.innerHTML += row;
    });
  };

  // Delete Vendor
  window.deleteVendor = async (id) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      await deleteDoc(doc(db, 'vendors', id));
      alert('Vendor deleted successfully!');
      loadVendors();
    }
  };

  // Load initial data
  loadInventory();
  loadVendors();
}

// Logout Functionality
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userRole'); // Clear role from localStorage
      localStorage.removeItem('userId'); // Clear user ID from localStorage
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  });
}