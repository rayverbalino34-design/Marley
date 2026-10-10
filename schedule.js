// schedule.js
// Facility scheduling (1.4.2) and conflict checking (1.4.4).

// Looks for an existing booking that overlaps the requested time.
// Returns that booking, or undefined if the time is free.
// ignoreId lets us skip one booking (used when approving, so a booking is not compared with itself).
function findConflict(facilityId, day, start, end, ignoreId) {
  return state.bookings.find(booking =>
    booking.facilityId === facilityId &&
    booking.day === day &&
    booking.status !== "declined" &&     // declined bookings do not block the slot
    booking.id !== ignoreId &&
    booking.start < end &&               // two time ranges overlap when each one
    start < booking.end                  // starts before the other one ends
  );
}

// Finds the first hour (from "start" on) where a booking of "length" hours fits.
// Returns null if there is no free window left that day.
function findNextFreeHour(facilityId, day, start, length) {
  for (let hour = start; hour + length <= CLOSE_HOUR; hour++) {
    if (!findConflict(facilityId, day, hour, hour + length)) {
      return hour;
    }
  }
  return null;
}

// Builds the table rows: one row per facility, with a cell for each hour.
// Booked hours become one wide colored block, free hours become clickable buttons.
function buildScheduleRows() {
  return FACILITIES.map(facility => {
    let cells = "";
    let hour = OPEN_HOUR;

    while (hour < CLOSE_HOUR) {
      const booking = state.bookings.find(b =>
        b.facilityId === facility.id &&
        b.day === state.day &&
        b.status !== "declined" &&
        b.start === hour
      );

      if (booking) {
        // A booking: one cell that spans all of its hours
        const hoursBooked = booking.end - booking.start;
        cells += `<td colspan="${hoursBooked}"><div class="bk ${booking.status}"><b>${escapeHtml(booking.requester)}</b><br>${escapeHtml(booking.purpose)}</div></td>`;
        hour = booking.end;
      } else {
        // A free hour: a button the user can click to pick it
        const picked = state.pickedSlot &&
          state.pickedSlot.facilityId === facility.id &&
          hour >= state.pickedSlot.start &&
          hour < state.pickedSlot.end;
        cells += `<td><button class="slot ${picked ? "pick" : ""}" data-f="${facility.id}" data-h="${hour}" aria-label="${facility.name} at ${formatHour(hour)}">${formatHour(hour)}</button></td>`;
        hour++;
      }
    }

    return `<tr><th class="fac" scope="row">${facility.name}<span>${facility.capacity}</span></th>${cells}</tr>`;
  }).join("");
}

// Draws the whole Schedule tab: the grid on the left and the reservation form on the right
function showSchedule() {
  // Values to pre-fill in the form (the clicked slot, or a default)
  const form = state.pickedSlot || { facilityId: "r101", start: 8, end: 9 };

  const dayButtons = DAYS.map((day, index) =>
    `<button aria-pressed="${index === state.day}" data-d="${index}">${day} Oct</button>`
  ).join("");

  const hourHeaders = HOURS.map(hour => `<th>${formatHour(hour)}</th>`).join("");

  const facilityOptions = FACILITIES.map(facility =>
    `<option value="${facility.id}" ${facility.id === form.facilityId ? "selected" : ""}>${facility.name}</option>`
  ).join("");

  const startOptions = HOURS.map(hour =>
    `<option value="${hour}" ${hour === form.start ? "selected" : ""}>${formatHour(hour)}</option>`
  ).join("");

  // End times are one hour later than the start times (8:00 ... 18:00)
  const endOptions = HOURS.map(hour => hour + 1).map(hour =>
    `<option value="${hour}" ${hour === form.end ? "selected" : ""}>${formatHour(hour)}</option>`
  ).join("");

  qs("#view").innerHTML = `<div class="row two"><section class="card">
    <div class="days" role="group" aria-label="Day">${dayButtons}</div>
    <div class="scroll"><table class="grid"><thead><tr><th></th>${hourHeaders}</tr></thead><tbody>${buildScheduleRows()}</tbody></table></div>
    <div class="legend"><span><i style="background:var(--free)"></i>Free (select to book)</span><span><i style="background:var(--ok)"></i>Approved</span><span><i style="background:var(--pend)"></i>Waiting for approval</span></div>
  </section>
  <aside class="card"><h2>Reserve a facility</h2><p class="mute">Select a free slot on the schedule, or fill in the form.</p>
  <form id="f" novalidate>
    <label for="ff">Facility</label><select id="ff">${facilityOptions}</select>
    <div class="two-c"><div><label for="fs">Start</label><select id="fs">${startOptions}</select></div>
    <div><label for="fe">End</label><select id="fe">${endOptions}</select></div></div>
    <label for="fp">Purpose</label><input id="fp" placeholder="e.g. Group presentation rehearsal" maxlength="60">
    <p style="margin:14px 0 0"><button class="btn" type="submit">Request reservation</button></p>
    <div id="m" class="msg" role="status" aria-live="polite"></div>
  </form></aside></div>`;

  // Day buttons: switch to another day
  document.querySelectorAll(".days button").forEach(button => {
    button.onclick = () => {
      state.day = +button.dataset.d;
      state.pickedSlot = null;
      showSchedule();
    };
  });

  // Free slots: remember the clicked slot and refill the form
  document.querySelectorAll(".slot").forEach(button => {
    button.onclick = () => {
      state.pickedSlot = {
        facilityId: button.dataset.f,
        start: +button.dataset.h,
        end: +button.dataset.h + 1
      };
      showSchedule();
      qs("#fp").focus();
    };
  });

  qs("#f").onsubmit = submitReservation;
}

// Runs when the reservation form is submitted
function submitReservation(event) {
  event.preventDefault();

  const facilityId = qs("#ff").value;
  const start = +qs("#fs").value;
  const end = +qs("#fe").value;
  const purpose = qs("#fp").value.trim();
  const messageBox = qs("#m");

  // Shows a message under the form ("err" = red, "good" = green)
  const showMessage = (type, text) => {
    messageBox.className = "msg show " + type;
    messageBox.textContent = text;
  };

  // 1. Check the form
  if (end <= start) {
    return showMessage("err", "End time must be after the start time.");
  }
  if (!purpose) {
    return showMessage("err", "Add a purpose so the approver knows what the reservation is for.");
  }

  // 2. Check for a conflict with another booking
  const conflict = findConflict(facilityId, state.day, start, end);
  if (conflict) {
    const length = end - start;
    const nextHour = findNextFreeHour(facilityId, state.day, start, length);
    const suggestion = (nextHour !== null)
      ? `Next free for ${length} hr: ${formatHour(nextHour)}–${formatHour(nextHour + length)}.`
      : "No free window that long today. Try another day.";
    return showMessage("err",
      `${facilityName(facilityId)} is already booked ${formatHour(conflict.start)}–${formatHour(conflict.end)} by ${conflict.requester}. ${suggestion}`);
  }

  // 3. Save the booking. Admin bookings are approved right away, others wait for approval.
  const requesterLabel = state.role === "Student" ? "You (Student)"
                       : state.role === "Faculty" ? "You (Faculty)"
                       : "Admin";
  state.bookings.push({
    id: state.nextId++,
    facilityId: facilityId,
    day: state.day,
    start: start,
    end: end,
    requester: requesterLabel,
    purpose: purpose,
    status: isAdmin() ? "approved" : "pending"
  });

  addNotification(isAdmin()
    ? `${facilityName(facilityId)} booked ${formatHour(start)}–${formatHour(end)}.`
    : `Request sent: ${facilityName(facilityId)}, ${formatHour(start)}–${formatHour(end)}. You will be notified after review.`);

  // 4. Redraw the schedule and confirm
  state.pickedSlot = null;
  showSchedule();
  qs("#m").className = "msg show good";
  qs("#m").textContent = isAdmin() ? "Reservation confirmed." : "Request sent for approval.";
  renderTabBar();   // updates the pending-requests badge
}
