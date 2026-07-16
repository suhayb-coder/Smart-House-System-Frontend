import api from './api.js?v=4';

// --- Auth Utilities ---
function getCurrentUser() {
    const userStr = localStorage.getItem('shs_user');
    return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('shs_user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('shs_user');
    window.location.href = 'login.html';
}

function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

// --- UI Utilities ---
function setupNavbar() {
    const navRight = document.getElementById('nav-right');
    const user = getCurrentUser();
    
    if (navRight) {
        let links = `
            <a href="rooms.html" class="mr-4 bg-gray-900 hover:bg-brand-600 text-white px-5 py-2.5 rounded-full font-medium transition-all duration-300 shadow-md">Explore Rooms</a>
        `;
        
        if (user) {
            links += `<a href="dashboard.html" class="mr-4 bg-gray-900 hover:bg-brand-600 text-white px-5 py-2.5 rounded-full font-medium transition-all duration-300 shadow-md">Dashboard</a>`;
            navRight.innerHTML = links + `
                <span class="text-gray-800 font-semibold px-3 py-2">Hi, ${user.name || 'User'}</span>
                <button id="logout-btn" class="ml-4 bg-gray-900 hover:bg-brand-600 text-white px-5 py-2.5 rounded-full font-medium transition-all duration-300 shadow-md">Logout</button>
            `;
            document.getElementById('logout-btn').addEventListener('click', () => {
                if (confirm('Are you sure you want to log out?')) {
                    logout();
                }
            });
        } else {
            navRight.innerHTML = links + `
                <a href="login.html" class="bg-gray-900 hover:bg-brand-600 text-white px-5 py-2.5 rounded-full font-medium transition-all duration-300 shadow-md">Login / Register</a>
            `;
        }
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    notification.className = `fixed bottom-5 right-5 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-y-10 opacity-0 z-50`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('translate-y-10', 'opacity-0');
        notification.classList.add('translate-y-0', 'opacity-100');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('translate-y-0', 'opacity-100');
        notification.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// --- Page Specific Logic ---
document.addEventListener('DOMContentLoaded', () => {
    setupNavbar();
    
    const path = window.location.pathname;
    
    if (path.endsWith('login.html')) {
        initLoginPage();
    } else if (path.endsWith('dashboard.html')) {
        initDashboardPage();
    } else if (path.endsWith('rooms.html')) {
        initRoomsPage();
    }
});

// --- ROOMS EXPLORER (Public / User) ---
function initRoomsPage() {
    const roomList = document.getElementById('room-list');
    if (!roomList) return;

    const loadRooms = async () => {
        try {
            const rooms = await api.getRooms();
            const requests = await api.getRequests(); // To filter out rented rooms
            
            // Assume a room is rented if it has an 'ACCEPTED' request
            const rentedRoomIds = requests.filter(r => r.status === 'ACCEPTED').map(r => r.room.id);
            const availableRooms = rooms.filter(r => !rentedRoomIds.includes(r.id));
            
            if (availableRooms.length === 0) {
                roomList.innerHTML = '<div class="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100"><p class="text-gray-500 text-lg">No rooms available at the moment.</p></div>';
                return;
            }
            
            roomList.innerHTML = availableRooms.map(r => {
                const defaultImages = ['home1.jpg', 'home2.jpg', 'image3.jpg'];
                const displayImage = defaultImages[r.id % defaultImages.length] || defaultImages[0];
                
                return `
                <div class="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 flex flex-col">
                    <img src="${displayImage}" alt="Room" class="w-full h-48 object-cover">
                    <div class="p-6 flex-grow flex flex-col">
                        <h3 class="text-xl font-bold text-gray-900 mb-2 capitalize">${r.properties} Room</h3>
                        <p class="text-gray-600 mb-4 flex-grow text-sm">${r.description || 'No description provided.'}</p>
                        <p class="text-gray-400 mb-4 text-xs">Room ID: ${r.id}</p>
                        
                        <div class="mt-4">
                            <input type="text" id="desc-${r.id}" placeholder="Why do you want to rent?" class="w-full mb-3 px-3 py-2 border rounded text-sm">
                            <button class="w-full bg-brand-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-brand-600 transition-colors shadow-sm" onclick="requestRent(${r.id})">Request to Rent</button>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading rooms:', error);
            roomList.innerHTML = '<div class="col-span-full text-center py-12 bg-red-50 rounded-xl border border-red-100"><p class="text-red-500">Failed to load rooms. Make sure backend is running.</p></div>';
        }
    };
    
    loadRooms();
}

window.requestRent = async (roomId) => {
    const user = getCurrentUser();
    if (!user) {
        showNotification('Please login to request a room', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    
    const descInput = document.getElementById(`desc-${roomId}`);
    const description = descInput ? descInput.value : 'Interested in renting this room.';
    
    try {
        await api.createRequest(roomId, user.userId || user.id, description); // Backend is userId
        showNotification('Room request submitted successfully!');
        if(descInput) descInput.value = '';
    } catch (error) {
        console.error(error);
        showNotification('Failed to submit request', 'error');
    }
};

// --- AUTHENTICATION ---
function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    
    if(showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        });
    }

    if(showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }
    
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            try {
                const user = await api.login(email, password);
                setCurrentUser(user);
                showNotification('Login successful!');
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } catch (error) {
                showNotification(error.message || 'Login failed', 'error');
            }
        });
    }
    
    if(registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = {
                name: document.getElementById('reg-name').value,
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-password').value,
                role: 'USER' // Default role
            };
            
            try {
                const user = await api.register(userData);
                setCurrentUser(user);
                showNotification('Registration successful!');
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } catch (error) {
                showNotification(error.message || 'Registration failed', 'error');
            }
        });
    }
}

// --- DASHBOARD (Admin vs User) ---
function initDashboardPage() {
    const user = checkAuth();
    if (!user) return;
    
    document.getElementById('dashboard-title').textContent = `${user.role === 'ADMIN' ? 'Admin' : 'User'} Dashboard`;
    
    if (user.role === 'ADMIN') {
        document.getElementById('admin-view').style.display = 'block';
        
        // Admin Visual Differentiation
        document.body.classList.replace('bg-gray-50', 'bg-slate-100');
        document.getElementById('dashboard-title').classList.replace('text-gray-900', 'text-slate-800');
        const nav = document.querySelector('nav');
        if (nav) {
            nav.classList.remove('glass-nav');
            nav.classList.add('bg-slate-900', 'shadow-md');
            const logo = nav.querySelector('a.font-display');
            if (logo) logo.classList.replace('text-gray-900', 'text-white');
            const hiText = nav.querySelector('span.text-gray-800');
            if (hiText) hiText.classList.replace('text-gray-800', 'text-gray-200');
        }
        
        initAdminDashboard();
    } else {
        document.getElementById('user-view').style.display = 'block';
        initUserDashboard(user);
    }
}

// -- User Dashboard
async function initUserDashboard(user) {
    const container = document.getElementById('user-requests');
    try {
        const allRequests = await api.getRequests();
        const myRequests = allRequests.filter(req => req.tenant && (req.tenant.id === user.userId || req.tenant.userId === user.userId)); // handle differing ID mappings
        
        if (myRequests.length === 0) {
            container.innerHTML = '<p class="text-gray-500 italic py-4">You have not requested any rooms yet.</p>';
            return;
        }
        
        container.innerHTML = myRequests.map(req => `
            <div class="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="text-md font-bold text-gray-900 capitalize">${req.room ? req.room.properties : 'Unknown'} Room (ID: ${req.room ? req.room.id : '?'})</h4>
                        <p class="text-xs text-gray-500 mt-1">${req.description || 'No description'}</p>
                    </div>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        req.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                        req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }">
                        ${req.status}
                    </span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p class="text-red-500 py-4">Failed to load requests.</p>';
    }
}

// -- Admin Dashboard
window.adminUsers = [];
window.adminRooms = [];

async function initAdminDashboard() {
    loadAdminUsers();
    loadAdminRooms();
}

// Admin - Users
async function loadAdminUsers() {
    const container = document.getElementById('admin-users-list');
    try {
        window.adminUsers = await api.getAllUsers();
        if (window.adminUsers.length === 0) {
            container.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">No users found.</td></tr>';
            return;
        }
        
        container.innerHTML = window.adminUsers.map(u => {
            const uId = u.userId || u.id;
            return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${u.name || 'Unnamed'}</div>
                    <div class="text-sm text-gray-500">${u.email}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${u.password}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold ${u.role === 'ADMIN' ? 'text-brand-600' : 'text-gray-500'}">${u.role || 'USER'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3" onclick="openAdminUserModal(${uId})">Edit</button>
                    ${u.role !== 'ADMIN' ? `<button class="text-red-600 hover:text-red-900" onclick="deleteUser(${uId})">Delete</button>` : ''}
                </td>
            </tr>
        `}).join('');
    } catch (err) {
        container.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Failed to load users.</td></tr>';
    }
}

window.openAdminUserModal = (userId = null) => {
    if (userId) {
        const user = window.adminUsers.find(u => (u.userId || u.id) === userId);
        if (user) {
            document.getElementById('user-modal-title').textContent = 'Edit User';
            document.getElementById('admin-user-id').value = user.userId || user.id;
            document.getElementById('admin-user-name').value = user.name || '';
            document.getElementById('admin-user-email').value = user.email || '';
            document.getElementById('admin-user-password').value = user.password || '';
            document.getElementById('admin-user-role').value = user.role || 'USER';
        }
    } else {
        document.getElementById('user-modal-title').textContent = 'Add User';
        document.getElementById('admin-user-form').reset();
        document.getElementById('admin-user-id').value = '';
    }
    
    document.getElementById('admin-user-modal').classList.remove('hidden');
};

window.closeAdminUserModal = () => document.getElementById('admin-user-modal').classList.add('hidden');

document.getElementById('admin-user-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = document.getElementById('admin-user-id').value;
    const userData = {
        name: document.getElementById('admin-user-name').value,
        email: document.getElementById('admin-user-email').value,
        password: document.getElementById('admin-user-password').value,
        role: document.getElementById('admin-user-role').value
    };
    try {
        if (userId) {
            await api.updateUser(userId, userData);
            showNotification('User updated successfully');
        } else {
            await api.createUser(userData);
            showNotification('User created successfully');
        }
        closeAdminUserModal();
        loadAdminUsers();
    } catch (err) {
        showNotification('Failed to save user', 'error');
    }
});

window.deleteUser = async (userId) => {
    if(!confirm("Delete this user?")) return;
    try {
        await api.deleteUser(userId);
        showNotification('User deleted');
        loadAdminUsers();
    } catch (err) {
        showNotification('Failed to delete user', 'error');
    }
};

// Admin - Rooms
async function loadAdminRooms() {
    const container = document.getElementById('admin-rooms-list');
    try {
        window.adminRooms = await api.getRooms();
        const allRequests = await api.getRequests();
        
        if (window.adminRooms.length === 0) {
            container.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">No rooms found.</td></tr>';
            return;
        }
        
        container.innerHTML = window.adminRooms.map(r => {
            // Find requests for this room
            const roomRequests = allRequests.filter(req => req.room && req.room.id === r.id);
            const acceptedReq = roomRequests.find(req => req.status === 'ACCEPTED');
            const pendingReqs = roomRequests.filter(req => req.status === 'PENDING');
            
            let statusHtml = '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Available</span>';
            let requestActionHtml = '';
            
            if (acceptedReq) {
                statusHtml = `
                    <div><span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Rented</span></div>
                    <div class="text-xs text-gray-500 mt-1">${acceptedReq.tenant ? acceptedReq.tenant.email : 'Unknown'}</div>
                `;
            } else if (pendingReqs.length > 0) {
                statusHtml = `
                    <div><span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Requested (${pendingReqs.length})</span></div>
                    <div class="text-xs text-gray-500 mt-1">${pendingReqs.map(p => p.tenant ? p.tenant.email : 'Unknown').join(', ')}</div>
                `;
                
                // Show actions to accept/reject the first pending request
                const p = pendingReqs[0];
                requestActionHtml = `
                    <button class="text-green-600 hover:text-green-900 mr-2" onclick="updateReqStatus(${p.id}, 'ACCEPTED')">Accept</button>
                    <button class="text-orange-600 hover:text-orange-900 mr-3" onclick="updateReqStatus(${p.id}, 'REJECTED')">Reject</button>
                `;
            }
            
            return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900 capitalize">${r.properties}</div>
                    <div class="text-xs text-gray-500">ID: ${r.id}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-600 line-clamp-2 max-w-xs">${r.description || 'No description'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${statusHtml}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    ${requestActionHtml}
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3" onclick="openAdminRoomModal(${r.id})">Edit</button>
                    <button class="text-red-600 hover:text-red-900" onclick="deleteRoom(${r.id})">Delete</button>
                </td>
            </tr>
        `}).join('');
    } catch (err) {
        container.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Failed to load rooms.</td></tr>';
    }
}

window.openAdminRoomModal = (roomId = null) => {
    if (roomId) {
        const room = window.adminRooms.find(r => r.id === roomId);
        if (room) {
            document.getElementById('room-modal-title').textContent = 'Edit Room';
            document.getElementById('admin-room-id').value = room.id;
            document.getElementById('admin-room-properties').value = room.properties;
            document.getElementById('admin-room-description').value = room.description || '';
        }
    } else {
        document.getElementById('room-modal-title').textContent = 'Add Room';
        document.getElementById('admin-room-form').reset();
        document.getElementById('admin-room-id').value = '';
    }
    document.getElementById('admin-room-modal').classList.remove('hidden');
};

window.closeAdminRoomModal = () => document.getElementById('admin-room-modal').classList.add('hidden');

document.getElementById('admin-room-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const roomId = document.getElementById('admin-room-id').value;
    const roomData = {
        properties: document.getElementById('admin-room-properties').value,
        description: document.getElementById('admin-room-description').value
    };
    try {
        if (roomId) {
            await api.updateRoom(roomId, roomData);
            showNotification('Room updated successfully');
        } else {
            await api.createRoom(roomData);
            showNotification('Room created successfully');
        }
        closeAdminRoomModal();
        loadAdminRooms();
    } catch (err) {
        showNotification('Failed to save room', 'error');
    }
});

window.deleteRoom = async (roomId) => {
    if(!confirm("Delete this room and all its requests?")) return;
    try {
        await api.deleteRoom(roomId);
        showNotification('Room deleted');
        loadAdminRooms();
    } catch (err) {
        showNotification('Failed to delete room', 'error');
    }
};

window.updateReqStatus = async (requestId, status) => {
    try {
        await api.updateRequestStatus(requestId, status);
        showNotification(`Request ${status.toLowerCase()}!`);
        loadAdminRooms();
    } catch (error) {
        showNotification('Failed to update request', 'error');
    }
};
