// Scaffolded with AI assistance — see AI_USAGE.md
// The browser's location, rounded to about 1 km before it leaves the device: the exact position
// is never sent anywhere. Browsers only give this to secure (https) pages and localhost.

const FRESH_FOR = 5 * 60 * 1000
const GIVE_UP_AFTER = 15000
const PLACES = 100

const rounded = (degrees) => Math.round(degrees * PLACES) / PLACES

// { lat, lng }, or throws with a message to show the reader.
export function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("This browser can't share your location."))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: rounded(coords.latitude), lng: rounded(coords.longitude) }),
      (error) =>
        reject(
          new Error(
            error.code === error.PERMISSION_DENIED
              ? 'Location is blocked for this site. Allow it in your browser settings, then try again.'
              : "Couldn't find your location. Try again.",
          ),
        ),
      { maximumAge: FRESH_FOR, timeout: GIVE_UP_AFTER },
    )
  })
}
