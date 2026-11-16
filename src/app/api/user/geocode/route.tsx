export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const address = searchParams.get("address");

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  let url = "";
  if (lat && lng) {
    url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  } else if (address) {
    url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  } else {
    return Response.json({ message: "Invalid parameters" }, { status: 400 });
  }

  const response = await fetch(url);
  const data = await response.json();

  if (data.status === "OK" && data.results.length > 0) {
    const result = data.results[0];
    const components = result.address_components;
    const city = components.find((c: any) => c.types.includes("locality"))?.long_name;
    const state = components.find((c: any) => c.types.includes("administrative_area_level_1"))?.short_name;
    const country = components.find((c: any) => c.types.includes("country"))?.short_name;
    const { lat: resLat, lng: resLng } = result.geometry.location;

    return Response.json({
      locationName: city && state && country ? `${city}, ${state}, ${country}` : result.formatted_address,
      city: city || result.formatted_address,
      latitude: resLat,
      longitude: resLng
    });
  }

  return Response.json({ locationName: "Unknown Location" }, { status: 404 });
}
