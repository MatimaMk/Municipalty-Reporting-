// utils/geoLocation.ts

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

export interface LocationError {
  code: number;
  message: string;
}

export async function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: "Geolocation is not supported by your browser",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        // Try to get address from reverse geocoding
        try {
          const address = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          );
          locationData.address = address;
        } catch (error) {
          // Address lookup failed, but we still have coordinates
          console.log("Address lookup failed:", error);
        }

        resolve(locationData);
      },
      (error) => {
        let message = "Unable to retrieve location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        reject({
          code: error.code,
          message: message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  // Using OpenStreetMap Nominatim API (free, no API key required)
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "LimpopoGovernmentPortal/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    const data = await response.json();

    // Build a readable address
    const address = data.address;
    const parts = [];

    if (address.road) parts.push(address.road);
    if (address.suburb) parts.push(address.suburb);
    if (address.city || address.town || address.village) {
      parts.push(address.city || address.town || address.village);
    }
    if (address.state) parts.push(address.state);

    return parts.join(", ") || data.display_name;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}

export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}°, ${longitude.toFixed(6)}°`;
}

export function getGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function getDistanceBetweenPoints(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Haversine formula to calculate distance in kilometers
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
