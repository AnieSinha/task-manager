/**
 * --- Seed Data Store ---
 */
const mockData = {
    backlogs: [
        { id: "bl-1", title: "Authentication Revamp", desc: "Migrate standard user sessions to explicit stateless JWT architecture tokens.", priority: "high", creator: "Alex Chen", createdAt: "2026-05-10", status: "assigned" },
        { id: "bl-2", title: "Dark Mode Contrast Audit", desc: "Verify color compliance curves against explicit WCAG AA specifications.", priority: "low", creator: "Sarah Jenkins", createdAt: "2026-05-14", status: "to-do" },
        { id: "bl-3", title: "Webhook Export Infrastructure", desc: "Build standard retry pipelines for tenant transactional events.", priority: "medium", creator: "Marcus Vance", createdAt: "2026-05-18", status: "in-progress" }
    ],
    features: [
        { id: "fe-1", parentId: "bl-1", parentTitle: "Authentication Revamp", title: "OAuth2 Provider Setup", desc: "Implement core integration hooks supporting Google and GitHub identity protocols.", status: "in-progress" },
        { id: "fe-2", parentId: "bl-3", parentTitle: "Webhook Export Infrastructure", title: "Event Subscription UI", desc: "Create direct entry tables managing active customer payload target URLs.", status: "to-do" }
    ],
    stories: [
        { id: "st-1", parentId: "fe-1", parentTitle: "OAuth2 Provider Setup", title: "GitHub Credential Exchange Handshake", desc: "Exchange unique temporary platform callback tokens for secure authorization access strings.", status: "under-review" },
        { id: "st-2", parentId: "fe-1", parentTitle: "OAuth2 Provider Setup", title: "Profile Data Extraction Processing", desc: "Map variable incoming schema payloads smoothly to local structured user profiles.", status: "to-do" }
    ],
    tasks: [
        { id: "ta-1", parentId: "st-1", parentTitle: "GitHub Credential Exchange Handshake", subTaskOf: null, title: "Configure HTTPS Secret Routes", desc: "Bind transport validation keys securely inside staging environment variables.", status: "completed", priority: "high", dueDate: "2026-05-22", createdAt: "2026-05-15", updatedAt: "2026-05-18", assignedTo: "Alex Chen" },
        { id: "ta-2", parentId: "st-1", parentTitle: "GitHub Credential Exchange Handshake", subTaskOf: "ta-1", title: "Write Token Parser Test Suite", desc: "Verify explicit behavior edge cases surrounding corrupted string signatures.", status: "in-progress", priority: "medium", dueDate: "2026-05-25", createdAt: "2026-05-16", updatedAt: null, assignedTo: "Elena Rostova" }
    ],
    team: [
        { name: "Alex Chen", email: "alex.c@agile.internal", isActive: true, roles: ["Tech Lead", "Security Admin"] },
        { name: "Sarah Jenkins", email: "sarah.j@agile.internal", isActive: true, roles: ["Senior UI/UX Designer"] },
        { name: "Marcus Vance", email: "marcus.v@agile.internal", isActive: true, roles: ["Backend Infrastructure Engineer"] },
        { name: "Elena Rostova", email: "elena.r@agile.internal", isActive: false, roles: ["QA Engineering Specialist"] }
    ]
};

// Map logical Kanban states directly to readable columns
const kanbanColumns = [
    { id: "to-do", title: "To Do" },
    { id: "in-progress", title: "In Progress" },
    { id: "completed", title: "Completed" }
];

/**
 * --- Application State Management ---
 */
let currentView = "backlogs";
let draggedElementInfo = null; // Track element metadata mid-drag

/**
 * --- Core DOM Component Selectors ---
 */
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const workspace = document.getElementById("mainWorkspace");
const navItems = document.querySelectorAll(".menu-item");

/**
 * --- Collapsible Sidebar Implementation ---
 */
sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
});

/**
 * --- Workspace Navigation View Engine ---
 */
navItems.forEach(item => {
    item.addEventListener("click", (e) => {
        e.preventDefault();
        const targetView = item.getAttribute("data-view");

        // Update styling state
        navItems.forEach(nav => nav.classList.remove("active"));
        item.classList.add("active");

        // Trigger render
        currentView = targetView;
        renderWorkspace();
    });
});

/**
 * --- UI Render Router ---
 */
function renderWorkspace() {
    // Clear workspace viewport
    workspace.innerHTML = "";

    // Generate Header block
    const viewTitle = currentView.charAt(0).toUpperCase() + currentView.slice(1);
    const headerHTML = `<div class="view-header"><h1>${viewTitle}</h1></div>`;

    if (["backlogs", "features", "stories", "tasks"].includes(currentView)) {
        workspace.innerHTML = headerHTML + renderKanbanBoard(currentView);
        initDragAndDropListeners();
    } else if (currentView === "team") {
        workspace.innerHTML = headerHTML + renderTeamView();
    } else {
        workspace.innerHTML = headerHTML + renderStaticPlaceholderView(viewTitle);
    }
}

/**
 * --- View Generator: Kanban Board ---
 */
function renderKanbanBoard(viewType) {
    const records = mockData[viewType] || [];

    let boardHTML = `<div class="kanban-board">`;

    kanbanColumns.forEach(col => {
        // Filter elements explicitly assigned to this lane step
        const laneItems = records.filter(item => item.status === col.id);

        boardHTML += `
            <div class="kanban-column" data-status="${col.id}">
                <div class="column-header">
                    <span>${col.title}</span>
                    <span class="column-count">${laneItems.length}</span>
                </div>
                <div class="column-cards" data-status-lane="${col.id}">
        `;

        laneItems.forEach(item => {
            boardHTML += generateCardHTML(viewType, item);
        });

        boardHTML += `
                </div>
            </div>
        `;
    });

    boardHTML += `</div>`;
    return boardHTML;
}

/**
 * --- Card Factory Matrix ---
 */
function generateCardHTML(type, item) {
    // Shared parameters
    const priorityBadge = item.priority ? `<span class="card-badge badge-${item.priority}">${item.priority}</span>` : '';

    switch (type) {
        case "backlogs":
            return `
                <div class="card" draggable="true" data-id="${item.id}">
                    <div class="card-title">${item.title}</div>
                    <div class="card-desc">${item.desc}</div>
                    <div class="card-meta">
                        ${priorityBadge}
                        <div class="card-owner" title="Created by"><i class='bx bx-user'></i> ${item.creator}</div>
                    </div>
                </div>
            `;

        case "features":
            return `
                <div class="card" draggable="true" data-id="${item.id}">
                    <a href="#" class="card-parent-link" onclick="navigateToView('backlogs')"><i class='bx bx-link'></i> ${item.parentTitle}</a>
                    <div class="card-title">${item.title}</div>
                    <div class="card-desc">${item.desc}</div>
                </div>
            `;

        case "stories":
            return `
                <div class="card" draggable="true" data-id="${item.id}">
                    <a href="#" class="card-parent-link" onclick="navigateToView('features')"><i class='bx bx-link'></i> ${item.parentTitle}</a>
                    <div class="card-title">${item.title}</div>
                    <div class="card-desc">${item.desc}</div>
                </div>
            `;

        case "tasks":
            const subtaskIndicator = item.subTaskOf ? `<span style="color:var(--warning); font-size:0.75rem; font-weight:600;"><i class='bx bx-git-branch'></i> Subtask</span>` : '';
            const updatedStamp = item.updatedAt ? `<span title="Last updated"><i class='bx bx-edit-alt'></i> ${item.updatedAt}</span>` : '';

            return `
                <div class="card" draggable="true" data-id="${item.id}">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <a href="#" class="card-parent-link" onclick="navigateToView('stories')"><i class='bx bx-link'></i> ${item.parentTitle}</a>
                        ${subtaskIndicator}
                    </div>
                    <div class="card-title">${item.title}</div>
                    <div class="card-desc">${item.desc}</div>
                    <div class="card-meta" style="flex-direction: column; gap: 0.5rem; align-items: flex-start;">
                        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                            ${priorityBadge}
                            <span class="card-date" title="Due Date"><i class='bx bx-calendar'></i> ${item.dueDate}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; width:100%; font-size:0.7rem; color:var(--text-muted); padding-top:0.25rem;">
                            <span>Assigned: <b>${item.assignedTo}</b></span>
                            ${updatedStamp}
                        </div>
                    </div>
                </div>
            `;
        default:
            return '';
    }
}

/**
 * --- View Generator: Team Profiles ---
 */
function renderTeamView() {
    let teamHTML = `<div class="team-grid">`;

    mockData.team.forEach(member => {
        const initials = member.name.split(' ').map(n => n[0]).join('');
        const statusClass = member.isActive ? 'status-active' : 'status-inactive';
        const statusLabel = member.isActive ? 'Active' : 'Inactive';

        let tagsHTML = '';
        member.roles.forEach(role => {
            tagsHTML += `<span class="role-tag">${role}</span>`;
        });

        teamHTML += `
            <div class="user-card">
                <span class="status-indicator ${statusClass}">${statusLabel}</span>
                <div class="user-header">
                    <div class="user-avatar">${initials}</div>
                    <div class="user-identity">
                        <h3>${member.name}</h3>
                        <p>${member.email}</p>
                    </div>
                </div>
                <div class="user-roles">
                    ${tagsHTML}
                </div>
            </div>
        `;
    });

    teamHTML += `</div>`;
    return teamHTML;
}

/**
 * --- Static Auxiliary Views Generator ---
 */
function renderStaticPlaceholderView(title) {
    return `
        <div class="empty-view-box">
            <i class='bx bx-cog'></i>
            <h2>${title} Dashboard</h2>
            <p>System workspace configurations and explicit data metrics pipelines running normally.</p>
        </div>
    `;
}

/**
 * --- Cross-Linking View Controller Helper ---
 */
window.navigateToView = function (viewKey) {
    const matchingNavItem = document.querySelector(`.menu-item[data-view="${viewKey}"]`);
    if (matchingNavItem) {
        matchingNavItem.click();
    }
};

/**
 * --- Native HTML5 Drag and Drop Handlers ---
 */
function initDragAndDropListeners() {
    const cards = document.querySelectorAll(".card");
    const lanes = document.querySelectorAll(".column-cards");

    cards.forEach(card => {
        card.addEventListener("dragstart", () => {
            card.classList.add("dragging");
            draggedElementInfo = {
                id: card.getAttribute("data-id"),
                viewType: currentView
            };
        });

        card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
            draggedElementInfo = null;
        });
    });

    lanes.forEach(lane => {
        lane.addEventListener("dragover", (e) => {
            e.preventDefault(); // Required to allow drop action target
            lane.classList.add("drag-over");
        });

        lane.addEventListener("dragleave", () => {
            lane.classList.remove("drag-over");
        });

        lane.addEventListener("drop", () => {
            lane.classList.remove("drag-over");
            if (!draggedElementInfo) return;

            const targetStatus = lane.getAttribute("data-status-lane");

            // Mutation Layer: Search and modify the matching record state
            const targetDataset = mockData[draggedElementInfo.viewType];
            const matchingRecord = targetDataset.find(item => item.id === draggedElementInfo.id);

            if (matchingRecord) {
                matchingRecord.status = targetStatus;
                if (matchingRecord.hasOwnProperty('updatedAt')) {
                    matchingRecord.updatedAt = new Date().toISOString().split('T')[0];
                }

                // Re-render local layout view immediately
                renderWorkspace();
            }
        });
    });
}

// Bootstrapping App initialization
document.addEventListener("DOMContentLoaded", () => {
    renderWorkspace();
});