const { getEventCoords, attachDistanceToEvent } = require('../utils/distance');

const testEvents = [
  { Name: "Club Eyz Wide Shut BI-Out", Venue: "Eyes Wide Shut" },
  { Name: "12th Annual Very Little Black Dress at Twist", Venue: "Twist Club" },
  { Name: "Couples and Single Fems Play Party", Venue: "Club Safe Word" },
  { Name: "Bronze Halloween Kickoff at Twist", Venue: "Twist Club" },
  { Name: "Lifestyle Event", Venue: "Twist Club" }
];

testEvents.forEach(e => {
  const coords = getEventCoords(e);
  const dist = attachDistanceToEvent(e, { lat: 25.7617, lon: -80.1918 });
  console.log(e.Name, "-> Coords:", coords, "-> Miles:", dist.distanceMiles);
});
