<script setup lang="ts">
const logoUrl = "/icon.png";

const menus = [
  {
    label: "Dashboard",
    to: "/",
    icon: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"],
  },
  {
    label: "Specification Groups",
    to: "/specification-groups",
    icon: ["M12 2 2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"],
  },
  {
    label: "Work Order Master",
    to: "/work-orders",
    icon: [
      "M8 6h13",
      "M8 12h13",
      "M8 18h13",
      "M3 6h.01",
      "M3 12h.01",
      "M3 18h.01",
    ],
  },
  {
    label: "Checklist",
    to: "/checklists",
    icon: [
      "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2",
      "M9 3h6v4H9z",
      "m9 14 2 2 4-4",
    ],
  },
  {
    label: "Dry Docks",
    to: "/dry-docks",
    icon: [
      "M12 22V8",
      "M5 12H2a10 10 0 0 0 20 0h-3",
      "M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    ],
  },
];

const collapsed = ref(false); // desktop: mode ikon
const mobileOpen = ref(false); // mobile: drawer
const canInstall = ref(false);
const nuxtApp = useNuxtApp();

onMounted(() => {
  collapsed.value = localStorage.getItem("sidebar-collapsed") === "1";
  if (typeof window !== "undefined") {
    window.addEventListener("pwa-can-install", () => {
      canInstall.value = true;
    });
  }
});

async function handleInstall() {
  if (nuxtApp.$installPwa) {
    const outcome = await (nuxtApp as any).$installPwa();
    if (outcome === "accepted") {
      canInstall.value = false;
    }
  }
}

function toggle() {
  collapsed.value = !collapsed.value;
  localStorage.setItem("sidebar-collapsed", collapsed.value ? "1" : "0");
}

// tutup drawer setiap pindah halaman
const route = useRoute();
watch(
  () => route.fullPath,
  () => (mobileOpen.value = false),
);
</script>

<template>
  <div class="shell">
    <!-- top bar: hanya tampil di mobile -->
    <header class="topbar">
      <button class="burger" aria-label="Menu" @click="mobileOpen = true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <img :src="logoUrl" alt="" class="logo" />
      <span class="topbar-title">Dry Dock</span>
    </header>

    <div v-if="mobileOpen" class="backdrop" @click="mobileOpen = false" />

    <aside class="sidebar" :class="{ collapsed, open: mobileOpen }">
      <div class="brand">
        <img :src="logoUrl" alt="Dry Dock" class="logo" />
        <span class="label">Dry Dock</span>
      </div>

      <button
        class="toggle"
        :title="collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
        @click="toggle"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          :style="{ transform: collapsed ? 'rotate(180deg)' : 'none' }"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <NuxtLink
        v-for="m in menus"
        :key="m.to"
        :to="m.to"
        class="item"
        :title="collapsed ? m.label : ''"
      >
        <svg
          class="ico"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path v-for="(d, i) in m.icon" :key="i" :d="d" />
        </svg>
        <span class="label">{{ m.label }}</span>
      </NuxtLink>

      <button
        v-if="canInstall"
        class="item install-btn"
        :title="collapsed ? 'Install Dry Dock App' : ''"
        @click="handleInstall"
      >
        <svg
          class="ico"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span class="label">Install App</span>
      </button>
    </aside>

    <main class="content"><slot /></main>
  </div>
</template>

<style>
:root {
  --primary: #29a1ff;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #f4f5f7;
  color: #1a1a1a;
}
.shell {
  display: flex;
  min-height: 100vh;
}

/* ---------- sidebar (desktop) ---------- */
.sidebar {
  position: sticky;
  top: 0;
  align-self: flex-start;
  height: 100vh;
  width: 240px;
  background: var(--primary);
  color: #fff;
  padding: 16px 12px;
  flex-shrink: 0;
  transition: width 0.25s ease;
  overflow: visible;
}
.sidebar.collapsed {
  width: 68px;
  padding-left: 10px;
  padding-right: 10px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px 20px;
  font-size: 20px;
  font-weight: 700;
}
.logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #eaf5ff;
  text-decoration: none;
  margin-bottom: 4px;
  white-space: nowrap;
}
.item:hover {
  background: rgba(255, 255, 255, 0.18);
}
.item.router-link-active {
  background: rgba(255, 255, 255, 0.28);
  color: #fff;
  font-weight: 600;
}
button.install-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px dashed rgba(255, 255, 255, 0.5);
  cursor: pointer;
  width: 100%;
  font-family: inherit;
  font-size: 14px;
  text-align: left;
  margin-top: 12px;
}
button.install-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: #fff;
}
.ico {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.label {
  overflow: hidden;
  white-space: nowrap;
}
.sidebar.collapsed .label {
  display: none;
}
.sidebar.collapsed .brand {
  padding-left: 8px;
  padding-right: 8px;
}
.sidebar.collapsed .item {
  justify-content: center;
  padding-left: 0;
  padding-right: 0;
}

.toggle {
  position: absolute;
  top: 22px;
  right: -12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #d0d5dd;
  background: #fff;
  color: #475467;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  z-index: 10;
}
.toggle:hover {
  background: #f2f4f7;
}
.toggle svg {
  width: 14px;
  height: 14px;
  transition: transform 0.25s ease;
}

.content {
  flex: 1;
  min-width: 0;
  padding: 28px 40px;
}

.topbar,
.backdrop {
  display: none;
}

/* ---------- mobile ---------- */
@media (max-width: 768px) {
  .topbar {
    display: flex;
    align-items: center;
    gap: 10px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    z-index: 30;
    padding: 0 12px;
    background: var(--primary);
    color: #fff;
  }
  .topbar-title {
    font-weight: 700;
    font-size: 18px;
  }
  .burger {
    background: none;
    border: 0;
    color: #fff;
    padding: 6px;
    display: flex;
    cursor: pointer;
  }
  .burger svg {
    width: 24px;
    height: 24px;
  }

  .backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 40;
  }

  /* sidebar jadi drawer, selalu tampil penuh (abaikan mode collapsed) */
  .sidebar,
  .sidebar.collapsed {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    height: 100%;
    width: 260px;
    padding: 16px 12px;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    overflow-y: auto;
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .sidebar.collapsed .label {
    display: inline;
  }
  .sidebar.collapsed .item {
    justify-content: flex-start;
    padding: 10px 12px;
  }
  .sidebar.collapsed .brand {
    padding: 8px 12px 20px;
  }
  .toggle {
    display: none;
  }

  .content {
    padding: 72px 16px 24px;
  }
}
</style>
