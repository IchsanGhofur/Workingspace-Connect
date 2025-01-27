// script.js

// Global variables to store coworking spaces data and user location
let coworkingSpaces = [];
let userLat = null;
let userLon = null;

// Function to fetch coworking spaces based on user's location
async function fetchCoworkingSpaces() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(fetchNearestCoworkingSpaces, () => {
            // If user denies location access, fetch all coworking spaces
            getAllCoworkingSpaces();
        });
    } else {
        alert("Geolocation is not supported by this browser.");
        // Fetch all coworking spaces if geolocation is not supported
        getAllCoworkingSpaces();
    }
}

// Function to fetch all coworking spaces from the backend
async function getAllCoworkingSpaces() {
    const response = await fetch('/api/coworking_spaces');
    const data = await response.json();
    console.log('Data received from /api/coworking_spaces:', data);
    coworkingSpaces = data;
    displayCoworkingSpaces(coworkingSpaces);
}


// Function to fetch nearest coworking spaces from the backend
async function fetchNearestCoworkingSpaces(position) {
    userLat = position.coords.latitude;
    userLon = position.coords.longitude;
    const response = await fetch(`/api/nearest_spaces?latitude=${userLat}&longitude=${userLon}`);
    const data = await response.json();
    coworkingSpaces = data;
    displayCoworkingSpaces(coworkingSpaces, userLat, userLon);
}

// Function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRad = angle => (angle * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// Function to search coworking spaces by name
async function searchCoworkingSpaces() {
    const query = document.getElementById('search-bar').value;
    if (query.length >= 3) {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        displayCoworkingSpaces(data, userLat, userLon);
    } else {
        displayCoworkingSpaces(coworkingSpaces, userLat, userLon);
    }
}

// Function to filter coworking spaces by opening time, closing time, and price
function filterCoworkingSpaces() {
    const openingTimeInput = document.getElementById('opening-time').value;
    const closingTimeInput = document.getElementById('closing-time').value;
    const maxPriceInput = parseFloat(document.getElementById('price').value);

    let filteredSpaces = coworkingSpaces;

    if (openingTimeInput) {
        filteredSpaces = filteredSpaces.filter(space => {
            const spaceOpeningTime = new Date(`1970-01-01T${space.opening_time}`);
            const inputOpeningTime = new Date(`1970-01-01T${openingTimeInput}`);
            return spaceOpeningTime <= inputOpeningTime;
        });
    }

    if (closingTimeInput) {
        filteredSpaces = filteredSpaces.filter(space => {
            const spaceClosingTime = new Date(`1970-01-01T${space.closing_time}`);
            const inputClosingTime = new Date(`1970-01-01T${closingTimeInput}`);
            return spaceClosingTime >= inputClosingTime;
        });
    }

    if (!isNaN(maxPriceInput)) {
        filteredSpaces = filteredSpaces.filter(space => space.price <= maxPriceInput);
    }

    displayCoworkingSpaces(filteredSpaces, userLat, userLon);
}

// Function to display coworking spaces in the UI
// static/js/script.js

function displayCoworkingSpaces(spaces, userLat = null, userLon = null) {
    const listContainer = document.getElementById('coworking-spaces-list');
    listContainer.innerHTML = ''; // Clear previous results

    if (spaces.length === 0) {
        listContainer.innerHTML = '<p>No results found</p>';
        return;
    }

    spaces.forEach(space => {
        let distanceText = '';
        const destLat = space.latitude;
        const destLng = space.longitude;

        // Calculate distance if user location is available
        if (typeof destLat === 'number' && !isNaN(destLat) &&
            typeof destLng === 'number' && !isNaN(destLng) &&
            userLat !== null && userLon !== null) {

            const distance = calculateDistance(userLat, userLon, destLat, destLng).toFixed(2);
            distanceText = `<p>Distance: ${distance} km</p>`;
        }

        // Create coworking space HTML
        const spaceDiv = document.createElement('div');
        spaceDiv.classList.add('coworking-space');
        spaceDiv.innerHTML = `
            <h3 class="space-name">${space.name}</h3>
            ${distanceText}
            <p>Monthly Price: Rs.${space.price}</p>
            <p>Opening Time: ${space.opening_time}</p>
            <p>Closing Time: ${space.closing_time}</p>
            <p>Food Available: ${space.food_availability ? 'Yes' : 'No'}</p>
            <p>Address: ${space.address}</p>
        `;

        // Redirect to the coworking_space detail page on click
        spaceDiv.addEventListener('click', () => {
            window.location.href = `/coworking_space/${space.id}`;
        });

        listContainer.appendChild(spaceDiv);
    });
}


// Function to show the map with directions from user's location to the coworking space
function showMap(destLat, destLng) {
    // Check if destination coordinates are valid
    if (isNaN(destLat) || isNaN(destLng)) {
        alert('Invalid coordinates for the destination');
        return;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            // Check if user's coordinates are valid
            if (isNaN(userLat) || isNaN(userLng)) {
                alert('Invalid coordinates for the user location');
                return;
            }

            const origin = new google.maps.LatLng(userLat, userLng);
            const destination = new google.maps.LatLng(destLat, destLng);

            const map = new google.maps.Map(document.getElementById('map-canvas'), {
                zoom: 14,
                center: origin,
            });

            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer();
            directionsRenderer.setMap(map);

            const request = {
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING,
            };

            directionsService.route(request, (result, status) => {
                if (status === 'OK') {
                    directionsRenderer.setDirections(result);
                } else {
                    alert('Directions request failed due to ' + status);
                }
            });
        }, error => {
            alert('Error obtaining your location. Please try again.');
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Initialize the map and fetch coworking spaces when the page loads
window.onload = () => {
    fetchCoworkingSpaces();
};
