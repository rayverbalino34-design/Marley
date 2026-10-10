// reports.js
// Analytics and reporting (1.4.6): simple usage numbers and bar charts.

// Total hours booked at one facility (declined bookings are not counted)
function hoursBooked(facilityId, activeBookings) {
  return activeBookings
    .filter(b => b.facilityId === facilityId)
    .reduce((total, b) => total + (b.end - b.start), 0);
}

function showReports() {
  const activeBookings = state.bookings.filter(b => b.status !== "declined");
  const totalHours = activeBookings.reduce((total, b) => total + (b.end - b.start), 0);

  // The facility with the most hours gets a full-width bar; the others are drawn relative to it
  const mostHours = Math.max(1, ...FACILITIES.map(f => hoursBooked(f.id, activeBookings)));

  const itemsCurrentlyOut = state.equipmentRequests
    .filter(r => r.status !== "declined" && r.status !== "returned")
    .reduce((total, r) => total + r.quantity, 0);

  const facilityBars = FACILITIES.map(facility => {
    const hours = hoursBooked(facility.id, activeBookings);
    return `<div class="bar"><span>${facility.name}</span><div class="t"><b style="width:${hours / mostHours * 100}%"></b></div><span>${hours} hr</span></div>`;
  }).join("");

  const equipmentBars = EQUIPMENT.map(item => {
    const out = itemsOut(item.id);
    return `<div class="bar"><span>${item.name}</span><div class="t"><b style="width:${out / item.total * 100}%"></b></div><span>${out}/${item.total}</span></div>`;
  }).join("");

  qs("#view").innerHTML = `<section class="card"><h2 style="margin-bottom:14px">Usage this week</h2>
    <div class="stats">
      <div><strong>${activeBookings.length}</strong>Facility bookings</div>
      <div><strong>${totalHours}</strong>Hours reserved</div>
      <div><strong>${pendingCount()}</strong>Waiting for approval</div>
      <div><strong>${itemsCurrentlyOut}</strong>Equipment items out</div>
    </div>
    <h3 style="margin-bottom:6px">Hours reserved by facility</h3>
    ${facilityBars}
    <h3 style="margin:18px 0 6px">Equipment in use</h3>
    ${equipmentBars}
    <p class="mute" style="margin-top:16px">Data resets when the page reloads. This prototype shows the interface only.</p></section>`;
}
