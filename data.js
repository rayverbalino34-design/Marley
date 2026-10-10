// data.js
// Sample data, the app's state, and small helper functions.
// The other files use these, so this file must be loaded first.

// ---------- Settings ----------
// Hours are written in 24-hour numbers here (13 = 1 PM) and shown in 12-hour AM/PM time on the page.
const OPEN_HOUR = 7;     // facilities open at 7:00 AM
const CLOSE_HOUR = 19;   // and close at 7:00 PM (the last booking must end by then)
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];   // hour slots shown (7 AM to 6 PM)
const DAYS = ["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16", "Sat 17"];

const FACILITIES = [
  { id: "r101",  name: "Room 101",       capacity: "40 seats" },
  { id: "lab1",  name: "Computer Lab 1", capacity: "30 seats" },
  { id: "sci",   name: "Science Lab",    capacity: "24 seats" },
  { id: "aud",   name: "Auditorium",     capacity: "300 seats" },
  { id: "court", name: "Covered Court",  capacity: "Sports area" }
];

const EQUIPMENT = [
  { id: "proj", name: "Projector",      total: 6 },
  { id: "lap",  name: "Laptop",         total: 10 },
  { id: "kit",  name: "Laboratory kit", total: 8 }
];

// ---------- State (everything that changes while the app runs) ----------
// status can be: "pending", "approved", "declined" (and "returned" for equipment)
const state = {
  tab: "Schedule",        // which tab is open
  day: 0,                 // index into DAYS
  role: "Student",        // "Student", "Faculty" or "Administrator"
  pickedSlot: null,       // the free slot the user clicked, if any

  bookings: [
    { id: 1, facilityId: "lab1",  day: 0, start: 9,  end: 11, requester: "Prof. Reyes",     purpose: "Programming lab",      status: "approved" },
    { id: 2, facilityId: "aud",   day: 0, start: 13, end: 16, requester: "Student Council", purpose: "General assembly",     status: "approved" },
    { id: 3, facilityId: "sci",   day: 0, start: 8,  end: 10, requester: "Prof. Dela Cruz", purpose: "Chemistry practical",  status: "approved" },
    { id: 4, facilityId: "r101",  day: 0, start: 14, end: 15, requester: "BSIT-3C",         purpose: "Group study",          status: "pending" },
    { id: 5, facilityId: "court", day: 1, start: 15, end: 17, requester: "PE Dept.",        purpose: "Intramurals practice", status: "approved" }
  ],

  equipmentRequests: [
    { id: 1, equipmentId: "proj", quantity: 2, pickupHour: 8,  requester: "Prof. Reyes", status: "approved" },
    { id: 2, equipmentId: "lap",  quantity: 4, pickupHour: 10, requester: "BSIT-3B",     status: "pending" }
  ],

  notifications: ["Your Room 101 request for Mon 12 is waiting for approval."],
  nextId: 10              // the id given to the next new request
};

// ---------- Helper functions ----------

// Short name for document.querySelector
const qs = selector => document.querySelector(selector);

// Makes text safe to put inside HTML, so things the user types (like the purpose)
// can never be run as code.
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Turns a 24-hour number into 12-hour time:  9 -> "9:00 AM",  13 -> "1:00 PM",  17 -> "5:00 PM"
function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const hourOn12Clock = hour % 12 === 0 ? 12 : hour % 12;   // 0 and 12 both show as 12
  return hourOn12Clock + ":00 " + suffix;
}

const facilityName = id => FACILITIES.find(facility => facility.id === id).name;
const equipmentName = id => EQUIPMENT.find(item => item.id === id).name;

const isAdmin = () => state.role === "Administrator";

// How many of an equipment item are currently taken (pending or approved requests).
// Declined and returned requests do not count.
function itemsOut(equipmentId) {
  return state.equipmentRequests
    .filter(r => r.equipmentId === equipmentId && r.status !== "declined" && r.status !== "returned")
    .reduce((total, r) => total + r.quantity, 0);
}

// Add a message to the top of the notifications list
function addNotification(text) {
  state.notifications.unshift(text);
}

// How many requests are still waiting for approval (shown on the Requests tab)
function pendingCount() {
  const pendingBookings = state.bookings.filter(b => b.status === "pending").length;
  const pendingEquipment = state.equipmentRequests.filter(r => r.status === "pending").length;
  return pendingBookings + pendingEquipment;
}