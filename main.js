// main.js
// Draws the tab bar and shows whichever tab is open.

function renderTabBar() {
  const tabNames = ["Schedule", "Equipment", "Requests", "Reports"];

  qs("#tabs").innerHTML = tabNames.map(name => {
    // Show a number badge on "Requests" when something is waiting for approval
    const badge = (name === "Requests" && pendingCount())
      ? `<span class="badge">${pendingCount()}</span>`
      : "";
    return `<button role="tab" aria-selected="${name === state.tab}" data-t="${name}">${name}${badge}</button>`;
  }).join("");

  // Clicking a tab switches to it
  qs("#tabs").querySelectorAll("button").forEach(button => {
    button.onclick = () => {
      state.tab = button.dataset.t;
      showCurrentTab();
    };
  });
}

// Draw the tab bar and the content of the open tab
function showCurrentTab() {
  renderTabBar();

  const pages = {
    Schedule: showSchedule,
    Equipment: showEquipment,
    Requests: showRequests,
    Reports: showReports
  };
  pages[state.tab]();
}
