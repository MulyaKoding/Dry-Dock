<script setup lang="ts">
interface ChecklistItem {
  id?: number;
  title: string;
  data_type: "text" | "number" | "boolean" | "date";
}

interface Checklist {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  items: ChecklistItem[];
}

const api = useApi();
const search = ref("");
const toast = ref("");

const { data: checklists, refresh } = await useAsyncData<Checklist[]>(
  "checklists-list",
  () => api.get<Checklist[]>("/checklists")
);

// Search filtered
const filteredChecklists = computed(() => {
  if (!checklists.value) return [];
  const q = search.value.toLowerCase().trim();
  if (!q) return checklists.value;
  return checklists.value.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
  );
});

// Modal / Drawer Form State
const showModal = ref(false);
const editingId = ref<number | null>(null);
const actionMenuOpenId = ref<number | null>(null);

const form = reactive({
  name: "",
  description: "",
  is_active: true,
  items: [
    { title: "", data_type: "text" as const },
    { title: "", data_type: "text" as const },
  ],
});

function notify(msg: string) {
  toast.value = msg;
  setTimeout(() => (toast.value = ""), 3000);
}

function openAdd() {
  editingId.value = null;
  form.name = "";
  form.description = "";
  form.is_active = true;
  form.items = [
    { title: "", data_type: "text" },
    { title: "", data_type: "text" },
  ];
  showModal.value = true;
  actionMenuOpenId.value = null;
}

function openEdit(cl: Checklist) {
  editingId.value = cl.id;
  form.name = cl.name;
  form.description = cl.description || "";
  form.is_active = cl.is_active;
  form.items = cl.items?.length
    ? cl.items.map((i) => ({ title: i.title, data_type: i.data_type }))
    : [{ title: "", data_type: "text" }];
  showModal.value = true;
  actionMenuOpenId.value = null;
}

function addItemRow() {
  form.items.push({ title: "", data_type: "text" });
}

function removeItemRow(index: number) {
  if (form.items.length > 1) {
    form.items.splice(index, 1);
  } else {
    notify("Minimal 1 item checklist diperlukan");
  }
}

async function submitForm() {
  if (!form.name.trim()) {
    notify("Checklist Name wajib diisi");
    return;
  }

  const validItems = form.items.filter((i) => i.title.trim());
  if (!validItems.length) {
    notify("Minimal 1 item checklist harus memiliki title");
    return;
  }

  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      is_active: form.is_active,
      items: validItems,
    };

    if (editingId.value) {
      await api.put(`/checklists/${editingId.value}`, payload);
      notify("Checklist berhasil diperbarui!");
    } else {
      await api.post("/checklists", payload);
      notify("Checklist berhasil ditambahkan!");
    }

    showModal.value = false;
    await refresh();
  } catch (e: any) {
    notify(e?.data?.message || "Gagal menyimpan checklist");
  }
}

async function removeChecklist(cl: Checklist) {
  if (!confirm(`Hapus Checklist "${cl.name}"?`)) return;
  try {
    await api.del(`/checklists/${cl.id}`);
    notify("Checklist berhasil dihapus");
    actionMenuOpenId.value = null;
    await refresh();
  } catch (e: any) {
    notify(e?.data?.message || "Gagal menghapus checklist");
  }
}
</script>

<template>
  <div class="checklists-page">
    <!-- Top Header -->
    <div class="header-row">
      <h1 class="page-title">Checklists</h1>

      <div class="header-tools">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Search"
            class="search-input"
          />
        </div>

        <button class="add-btn" @click="openAdd">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add
        </button>
      </div>
    </div>

    <!-- Table of Checklists -->
    <div class="table-container">
      <table class="checklists-table">
        <thead>
          <tr>
            <th>CHECKLIST NAME</th>
            <th>DESCRIPTION</th>
            <th>ACTIVE</th>
            <th style="width: 40px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cl in filteredChecklists" :key="cl.id">
            <td class="name-cell">
              <b>{{ cl.name }}</b>
            </td>
            <td class="desc-cell">{{ cl.description }}</td>
            <td class="active-cell">
              <span :class="cl.is_active ? 'val-yes' : 'val-no'">
                {{ cl.is_active ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="action-cell">
              <div class="dots-wrapper" @click.stop>
                <button
                  class="dots-btn"
                  title="Actions"
                  @click="actionMenuOpenId = actionMenuOpenId === cl.id ? null : cl.id"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="19" cy="12" r="2"/>
                    <circle cx="5" cy="12" r="2"/>
                  </svg>
                </button>

                <!-- Popover Menu -->
                <div v-if="actionMenuOpenId === cl.id" class="dots-popover">
                  <button @click="openEdit(cl)">Edit</button>
                  <button class="danger" @click="removeChecklist(cl)">Delete</button>
                </div>
              </div>
            </td>
          </tr>
          <tr v-if="!filteredChecklists.length">
            <td colspan="4" class="empty-cell">Tidak ada Checklist ditemukan.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Back Button -->
    <div class="bottom-bar">
      <button class="back-btn" @click="navigateTo('/')">
        Back
      </button>
    </div>

    <!-- MODAL / DRAWER: Add / Edit Item (Images 2 & 3) -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-dialog">
        <!-- Modal Top -->
        <div class="modal-header">
          <h2 class="modal-title">{{ editingId ? "Edit item" : "Add item" }}</h2>
          <button class="modal-close" @click="showModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Modal Form Body -->
        <div class="modal-body">
          <!-- Checklist Name -->
          <div class="form-group">
            <div class="label-row">
              <label class="form-label">Checklist Name</label>
              <span class="badge-req">Required</span>
            </div>
            <input
              v-model="form.name"
              type="text"
              class="form-input"
              placeholder="Enter checklist name..."
            />
          </div>

          <!-- Description -->
          <div class="form-group">
            <label class="form-label">Description</label>
            <input
              v-model="form.description"
              type="text"
              class="form-input"
              placeholder="Enter description..."
            />
          </div>

          <!-- Active Toggle Switch -->
          <div class="form-group switch-group">
            <label class="form-label">Active</label>
            <label class="toggle-switch">
              <input type="checkbox" v-model="form.is_active" />
              <span class="switch-slider"></span>
            </label>
          </div>

          <!-- Checklist Items Section -->
          <div class="items-section">
            <div class="items-section-header">
              <div>
                <h3 class="items-heading">Checklist Items</h3>
                <span class="items-sub">Minimum one item required*</span>
              </div>
              <button class="add-item-btn" type="button" @click="addItemRow">
                Add
              </button>
            </div>

            <!-- Dynamic Items List -->
            <div class="items-list-container">
              <div
                v-for="(item, idx) in form.items"
                :key="idx"
                class="item-form-block"
              >
                <div class="item-block-header">
                  <span class="item-num">{{ idx + 1 }}</span>
                  <button
                    v-if="form.items.length > 1"
                    type="button"
                    class="remove-row-btn"
                    title="Remove item"
                    @click="removeItemRow(idx)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                <!-- Title Field -->
                <div class="form-group">
                  <div class="label-row">
                    <label class="form-label">Title</label>
                    <span class="badge-req">Required</span>
                  </div>
                  <input
                    v-model="item.title"
                    type="text"
                    class="form-input"
                    placeholder="Enter item title..."
                  />
                </div>

                <!-- Data Type Field -->
                <div class="form-group">
                  <div class="label-row">
                    <label class="form-label">Data Type</label>
                    <span class="badge-req">Required</span>
                  </div>
                  <select v-model="item.data_type" class="form-input">
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean (Yes/No)</option>
                    <option value="date">Date</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button class="foot-btn primary" @click="submitForm">Submit</button>
          <button class="foot-btn cancel" @click="showModal = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div v-if="toast" class="toast-box">{{ toast }}</div>
  </div>
</template>

<style scoped>
.checklists-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 60px;
}

/* Header */
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #d0d5dd;
  border-radius: 10px;
  padding: 8px 14px;
  gap: 10px;
  width: 260px;
}

.search-icon {
  width: 18px;
  height: 18px;
  color: #94a3b8;
}

.search-input {
  border: 0;
  background: transparent;
  outline: none;
  font-size: 14px;
  width: 100%;
}

.add-btn {
  background: #29a1ff;
  color: #ffffff;
  border: 0;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.add-btn:hover {
  background: #1a8dec;
}

.add-btn svg {
  width: 16px;
  height: 16px;
}

/* Table */
.table-container {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.checklists-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.checklists-table th {
  background: #ffffff;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  letter-spacing: 0.5px;
}

.checklists-table td {
  padding: 18px 20px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #334155;
}

.name-cell {
  color: #1e293b;
  font-size: 15px;
}

.desc-cell {
  color: #64748b;
}

.val-yes {
  color: #334155;
  font-weight: 500;
}

.val-no {
  color: #64748b;
  font-weight: 500;
}

.action-cell {
  text-align: right;
}

.dots-wrapper {
  position: relative;
  display: inline-block;
}

.dots-btn {
  background: none;
  border: 0;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}

.dots-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.dots-btn svg {
  width: 20px;
  height: 20px;
}

.dots-popover {
  position: absolute;
  right: 0;
  top: 32px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 4px;
  display: flex;
  flex-direction: column;
  min-width: 120px;
  z-index: 10;
}

.dots-popover button {
  background: none;
  border: 0;
  text-align: left;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  color: #334155;
}

.dots-popover button:hover {
  background: #f1f5f9;
}

.dots-popover button.danger {
  color: #e63946;
}

.empty-cell {
  text-align: center;
  color: #94a3b8;
  padding: 36px;
}

/* Bottom Bar */
.bottom-bar {
  display: flex;
  margin-top: 8px;
}

.back-btn {
  background: #29a1ff;
  color: #ffffff;
  border: 0;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.back-btn:hover {
  background: #1a8dec;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  z-index: 999;
}

.modal-dialog {
  background: #ffffff;
  width: 520px;
  max-width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 25px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.25s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: 0;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.modal-close svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-label {
  font-size: 13.5px;
  font-weight: 600;
  color: #1e293b;
}

.badge-req {
  font-size: 11.5px;
  color: #94a3b8;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: #ffffff;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #29a1ff;
}

/* Switch */
.switch-group {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.25s;
  border-radius: 26px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.25s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

input:checked + .switch-slider {
  background-color: #29a1ff;
}

input:checked + .switch-slider:before {
  transform: translateX(22px);
}

/* Items Section */
.items-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-top: 1px solid #f1f5f9;
  padding-top: 18px;
}

.items-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.items-heading {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.items-sub {
  font-size: 12px;
  color: #64748b;
}

.add-item-btn {
  background: #29a1ff;
  color: #ffffff;
  border: 0;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.add-item-btn:hover {
  background: #1a8dec;
}

.items-list-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.item-form-block {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-num {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
}

.remove-row-btn {
  background: none;
  border: 0;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
}

.remove-row-btn:hover {
  color: #e63946;
}

.remove-row-btn svg {
  width: 16px;
  height: 16px;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  gap: 10px;
  padding: 18px 24px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.foot-btn {
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 0;
}

.foot-btn.primary {
  background: #29a1ff;
  color: #ffffff;
}

.foot-btn.primary:hover {
  background: #1a8dec;
}

.foot-btn.cancel {
  background: #e2e8f0;
  color: #475467;
}

.toast-box {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}
</style>
