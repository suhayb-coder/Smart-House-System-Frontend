const BASE_URL = 'http://localhost:8080/api';

const api = {
    // Auth
    login: async (email, password) => {
        const response = await fetch(`${BASE_URL}/users/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, {
            method: 'POST'
        });
        if (!response.ok) {
            throw new Error('Login failed');
        }
        return response.json();
    },
    register: async (userData) => {
        const response = await fetch(`${BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) {
            throw new Error('Registration failed');
        }
        return response.json();
    },
    async getAllUsers() {
        const response = await fetch(`${BASE_URL}/users`);
        if (!response.ok) throw new Error('Failed to fetch users');
        return await response.json();
    },
    async createUser(userData) {
        const response = await fetch(`${BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error('Failed to create user');
        return await response.json();
    },
    async updateUser(userId, userData) {
        const response = await fetch(`${BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error('Failed to update user');
        return await response.json();
    },
    async deleteUser(userId) {
        const response = await fetch(`${BASE_URL}/users/${userId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete user');
        return true;
    },

    // Rooms
    getRooms: async () => {
        const response = await fetch(`${BASE_URL}/rooms`);
        return response.json();
    },
    getRoomById: async (id) => {
        const response = await fetch(`${BASE_URL}/rooms/${id}`);
        return response.json();
    },
    createRoom: async (roomData) => {
        const response = await fetch(`${BASE_URL}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roomData)
        });
        if (!response.ok) throw new Error('Failed to create room');
        return response.json();
    },
    updateRoom: async (roomId, roomData) => {
        const response = await fetch(`${BASE_URL}/rooms/${roomId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roomData)
        });
        if (!response.ok) throw new Error('Failed to update room');
        return response.json();
    },
    deleteRoom: async (roomId) => {
        const response = await fetch(`${BASE_URL}/rooms/${roomId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete room');
        return true;
    },

    // Room Requests
    getRequests: async () => {
        const response = await fetch(`${BASE_URL}/room-requests`);
        return response.json();
    },
    createRequest: async (roomId, tenantId, description) => {
        const response = await fetch(`${BASE_URL}/room-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                room: { id: roomId },
                tenant: { id: tenantId },
                description: description,
                status: 'PENDING'
            })
        });
        if (!response.ok) throw new Error('Failed to create request');
        return response.json();
    },
    updateRequestStatus: async (requestId, status) => {
        const response = await fetch(`${BASE_URL}/room-requests/${requestId}/status?status=${status}`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Failed to update request status');
        return response.json();
    },
    deleteRequest: async (requestId) => {
        const response = await fetch(`${BASE_URL}/room-requests/${requestId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete request');
        return true;
    }
};

export default api;
