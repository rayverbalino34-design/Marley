// requests.js
// Requests list, approvals, cancelling, returning equipment, and notifications (1.4.5).

// Combines facility bookings and equipment requests into one list of rows.
// kind: "b" = booking, "e" = equipment request
function buildRequestRows() {
  const bookingRows = state.bookings.map(b => ({
    kind: "b",
    id: b.id,
    title: `${facilityName(b.facilityId)} · ${DAYS[b.day]} Oct, ${formatHour(b.start)}–${formatHour(b.end)}`,
    details: b.requester + " – " + b.purpose,
    status: b.status,
    isMine: b.requester.startsWith("You"),
    isEquipment: false
  }));

  const equipmentRows = state.equipmentRequests.map(r => ({
    kind: "e",
    id: r.id,
    title: `${r.quantity} × ${equipmentName(r.equipmentId)} · pickup ${formatHour(r.pickupHour)}`,
    details: r.requester,
    status: r.status,
    isMine: r.requester.startsWith("You"),
    isEquipment: true
  }));

  // Pending requests go to the top of the list
  return [...bookingRows, ...equipmentRows].sort((a, b) =>
    (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1)
  );
}

// Builds the buttons / status label on the right side of one row
function buildRowActions(row) {
  const key = row.kind + row.id;   // e.g. "b4" = booking 4, "e2" = equipment request 2
  let html;

  if (row.status === "pending" && isAdmin()) {
    // The administrator can approve or decline pending requests
    html = `<button class="btn" data-a="${key}" data-v="approved">Approve</button> <button class="btn danger" data-a="${key}" data-v="declined">Decline</button>`;
  } else {
    // Everyone else just sees the status
    const label = row.status === "pending" ? "Waiting" : row.status[0].toUpperCase() + row.status.slice(1);
    html = `<span class="tag ${row.status}">${label}</span>`;
  }

  // You can cancel your own pending requests
  if (row.isMine && row.status === "pending") {
    html += ` <button class="btn alt" data-x="${key}">Cancel</button>`;
  }

  // The administrator can mark approved equipment as returned
  if (isAdmin() && row.isEquipment && row.status === "approved") {
    html += ` <button class="btn alt" data-x="${key}" data-ret="1">Mark returned</button>`;
  }

  return html;
}

function showRequests() {
  const intro = isAdmin()
    ? "Review pending requests below."
    : "Only administrators can approve requests. Sign in as an administrator to try it.";

  const listItems = buildRequestRows().map(row =>
    `<li><div><strong>${row.title}</strong><br><span class="mute">${escapeHtml(row.details)}</span></div>
    <div>${buildRowActions(row)}</div></li>`
  ).join("");

  const notificationItems = state.notifications.map(text => `<li>${escapeHtml(text)}</li>`).join("")
    || "<li class='mute'>Nothing new.</li>";

  qs("#view").innerHTML = `<div class="row two"><section class="card"><h2>Requests</h2>
    <p class="mute">${intro}</p>
    <ul class="list">${listItems}</ul></section>
    <aside class="card"><h2>Notifications</h2><ul class="list">${notificationItems}</ul></aside></div>`;

  // Cancel and Mark returned buttons
  document.querySelectorAll("[data-x]").forEach(button => {
    button.onclick = () => {
      const kind = button.dataset.x[0];
      const id = +button.dataset.x.slice(1);
      if (button.dataset.ret) {
        markReturned(id);
      } else {
        cancelRequest(kind, id);
      }
    };
  });

  // Approve and Decline buttons
  document.querySelectorAll("[data-a]").forEach(button => {
    button.onclick = () => {
      const kind = button.dataset.a[0];
      const id = +button.dataset.a.slice(1);
      reviewRequest(kind, id, button.dataset.v);
    };
  });
}

// Deletes one of your own pending requests
function cancelRequest(kind, id) {
  if (kind === "b") {
    state.bookings = state.bookings.filter(b => b.id !== id);
  } else {
    state.equipmentRequests = state.equipmentRequests.filter(r => r.id !== id);
  }
  addNotification("Request cancelled.");
  showRequests();
  renderTabBar();
}

// Marks borrowed equipment as returned, so it becomes available again
function markReturned(id) {
  const request = state.equipmentRequests.find(r => r.id === id);
  request.status = "returned";
  addNotification(`${equipmentName(request.equipmentId)} returned.`);
  showRequests();
  renderTabBar();
}

// The administrator approves or declines a request
function reviewRequest(kind, id, decision) {
  const list = (kind === "b") ? state.bookings : state.equipmentRequests;
  const request = list.find(r => r.id === id);

  // Before approving a booking, make sure another approved booking has not taken the slot
  let slotTaken = false;
  if (kind === "b" && decision === "approved") {
    const conflict = findConflict(request.facilityId, request.day, request.start, request.end, request.id);
    slotTaken = Boolean(conflict && conflict.status === "approved");
  }

  if (slotTaken) {
    request.status = "declined";
    addNotification("Declined automatically: time slot taken.");
  } else {
    request.status = decision;
    const name = (kind === "b") ? facilityName(request.facilityId) : equipmentName(request.equipmentId);
    addNotification(`${name} request ${decision} for ${request.requester}.`);
  }

  showRequests();
  renderTabBar();
}
