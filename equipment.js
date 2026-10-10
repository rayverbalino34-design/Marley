// equipment.js
// Equipment tracking (1.4.3): shows what is available and lets users reserve it.

function showEquipment() {
  // One card per equipment item
  const cards = EQUIPMENT.map(item => {
    const available = item.total - itemsOut(item.id);
    const availablePercent = available / item.total * 100;
    const buttonLabel = available < 1 ? "Fully booked" : "Reserve " + item.name.toLowerCase();

    const quantityOptions = [1, 2, 3, 4].map(n => `<option>${n}</option>`).join("");
    const pickupOptions = HOURS.map(hour => `<option value="${hour}">${formatHour(hour)}</option>`).join("");

    return `<article class="card"><h3>${item.name}</h3>
      <div class="meter"><b style="width:${availablePercent}%"></b></div><div class="mute">${available} of ${item.total} available</div>
      <div class="two-c" style="margin-top:12px"><div><label class="mute" for="q-${item.id}">Quantity</label><select id="q-${item.id}">${quantityOptions}</select></div>
      <div><label class="mute" for="p-${item.id}">Pickup</label><select id="p-${item.id}">${pickupOptions}</select></div></div>
      <p style="margin:14px 0 0"><button class="btn" data-e="${item.id}" ${available < 1 ? "disabled" : ""}>${buttonLabel}</button></p>
      <div class="msg" id="em-${item.id}" role="status"></div></article>`;
  }).join("");

  qs("#view").innerHTML = `<h2 style="margin-bottom:6px">Equipment</h2>
    <p class="mute" style="margin-top:0">Reserve for pickup at the equipment room. Counts update as requests are made.</p>
    <div class="eq">${cards}</div>`;

  // Each "Reserve" button reserves its own item
  document.querySelectorAll("[data-e]").forEach(button => {
    button.onclick = () => reserveEquipment(button.dataset.e);
  });
}

function reserveEquipment(equipmentId) {
  const item = EQUIPMENT.find(e => e.id === equipmentId);
  const quantity = +qs("#q-" + equipmentId).value;
  const pickupHour = +qs("#p-" + equipmentId).value;
  const available = item.total - itemsOut(equipmentId);
  const messageBox = qs("#em-" + equipmentId);

  // Not enough items left
  if (quantity > available) {
    messageBox.className = "msg show err";
    messageBox.textContent = `Only ${available} available. Lower the quantity.`;
    return;
  }

  // Save the request. Admin requests are approved right away, others wait for approval.
  state.equipmentRequests.push({
    id: state.nextId++,
    equipmentId: equipmentId,
    quantity: quantity,
    pickupHour: pickupHour,
    requester: isAdmin() ? "Admin" : "You (" + state.role + ")",
    status: isAdmin() ? "approved" : "pending"
  });

  addNotification(`Equipment request: ${quantity} × ${equipmentName(equipmentId)}.`);
  showEquipment();    // redraw so the available count updates
  renderTabBar();     // updates the pending-requests badge
}
