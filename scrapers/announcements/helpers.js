// Helper to get the base URL for Canvas
// Define and export the getCanvasBaseUrl function
export function getCanvasBaseUrl() {
  return 'https://canvas.tue.nl/api/v1';  // Replace with your Canvas base URL
}

// If you need to define getAuthHeaders
export function getAuthHeaders(cookies) {
  return {
    Cookie: cookies.map(c => `${c.name}=${c.value}`).join('; '),
  };
}