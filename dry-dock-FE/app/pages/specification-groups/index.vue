<script setup lang="ts">
interface Vessel {
  id: number;
  name: string;
}
interface Group {
  id: number;
  group_no: string | null;
  name: string;
  sort_order: number;
  is_frontpage: boolean;
  vessel_names: string | null;
  vessel_ids: number[];
}

const api = useApi();
const search = ref("");
const vesselFilter = ref<number | "">("");
const toast = ref("");

const { data: vessels } = await useAsyncData("vessels", () =>
  api.get<Vessel[]>("/vessels"),
);
const { data: groups, refresh } = await useAsyncData(
  "spec-groups",
  () =>
    api.get<Group[]>(
      `/specification-groups${vesselFilter.value ? `?vessel_id=${vesselFilter.value}` : ""}`,
    ),
  { watch: [vesselFilter] },
);

const filtered = computed(() =>
  (groups.value ?? []).filter((g) =>
    `${g.name} ${g.group_no ?? ""}`
      .toLowerCase()
      .includes(search.value.toLowerCase()),
  ),
);

// ---- form ----
const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({
  name: "",
  group_no: "",
  sort_order: 0,
  is_frontpage: false,
  vessel_ids: [] as number[],
});

function openAdd() {
  editingId.value = null;
  Object.assign(form, {
    name: "",
    group_no: "",
    sort_order: 0,
    is_frontpage: false,
    vessel_ids: [],
  });
  showForm.value = true;
}
function openEdit(g: Group) {
  editingId.value = g.id;
  Object.assign(form, {
    name: g.name,
    group_no: g.group_no ?? "",
    sort_order: g.sort_order,
    is_frontpage: g.is_frontpage,
    vessel_ids: [...g.vessel_ids],
  });
  showForm.value = true;
}

function notify(msg: string) {
  toast.value = msg;
  setTimeout(() => (toast.value = ""), 2500);
}

async function submit() {
  try {
    if (editingId.value)
      await api.put(`/specification-groups/${editingId.value}`, form);
    else await api.post("/specification-groups", form);
    showForm.value = false;
    await refresh();
    notify("Success");
  } catch (e: any) {
    notify(e?.data?.message ?? "Gagal menyimpan");
  }
}

async function remove(g: Group) {
  if (!confirm(`Hapus "${g.name}"?`)) return;
  try {
    await api.del(`/specification-groups/${g.id}`);
    await refresh();
    notify("Success");
  } catch (e: any) {
    notify(e?.data?.message ?? "Gagal menghapus");
  }
}
</script>

<template>
  <div>
    <div class="bar">
      <h1>Specification Groups</h1>
      <div class="tools">
        <input v-model="search" placeholder="Search" class="input" />
        <select v-model="vesselFilter" class="input">
          <option value="">All ({{ groups?.length ?? 0 }})</option>
          <option v-for="v in vessels" :key="v.id" :value="v.id">
            {{ v.name }}
          </option>
        </select>
        <button class="btn" @click="openAdd">+ Add</button>
      </div>
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Vessel</th>
            <th>Group No</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in filtered" :key="g.id">
            <td data-label="Name">
              <b>{{ g.name }}</b>
            </td>
            <td data-label="Vessel">{{ g.vessel_names }}</td>
            <td data-label="Group No">{{ g.group_no }}</td>
            <td class="act">
              <button class="link" @click="openEdit(g)">Edit</button>
              <button class="link danger" @click="remove(g)">Delete</button>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="4" class="empty">Belum ada data</td>
          </tr>
        </tbody>
      </table>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Vessel</th>
          <th>Group No</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="g in filtered" :key="g.id">
          <td>
            <b>{{ g.name }}</b>
          </td>
          <td>{{ g.vessel_names }}</td>
          <td>{{ g.group_no }}</td>
          <td class="act">
            <button class="link" @click="openEdit(g)">Edit</button>
            <button class="link danger" @click="remove(g)">Delete</button>
          </td>
        </tr>
        <tr v-if="!filtered.length">
          <td colspan="4" class="empty">Belum ada data</td>
        </tr>
      </tbody>
    </table>

    <div v-if="showForm" class="overlay" @click.self="showForm = false">
      <div class="modal">
        <h2>{{ editingId ? "Edit item" : "Add item" }}</h2>

        <label>Vessel</label>
        <div class="checks">
          <label v-for="v in vessels" :key="v.id">
            <input type="checkbox" :value="v.id" v-model="form.vessel_ids" />
            {{ v.name }}
          </label>
        </div>

        <label>Group No.</label>
        <input v-model="form.group_no" class="input full" />

        <label>Name <small>Required</small></label>
        <input v-model="form.name" class="input full" />

        <label>Sort Order</label>
        <input
          v-model.number="form.sort_order"
          type="number"
          class="input full"
        />

        <label class="row"
          ><input type="checkbox" v-model="form.is_frontpage" />
          Frontpage</label
        >

        <div class="foot">
          <button class="btn" :disabled="!form.name" @click="submit">
            Submit
          </button>
          <button class="btn ghost" @click="showForm = false">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.bar h1 {
  margin: 0;
  font-size: 26px;
}
.tools {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.table-wrap {
  overflow-x: auto;
  border-radius: 10px;
}

@media (max-width: 768px) {
  .bar h1 {
    font-size: 22px;
    width: 100%;
  }
  .tools {
    width: 100%;
  }
  .tools .input {
    flex: 1 1 140px;
    min-width: 0;
  }
  .tools .btn {
    flex: 0 0 auto;
  }

  /* tabel jadi kartu */
  .table,
  .table tbody,
  .table tr,
  .table td {
    display: block;
    width: 100%;
  }
  .table thead {
    display: none;
  }
  .table {
    background: transparent;
  }
  .table tr {
    background: #fff;
    border-radius: 10px;
    margin-bottom: 12px;
    padding: 6px 0;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
  }
  .table td {
    border: 0;
    padding: 8px 16px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    text-align: right;
  }
  .table td::before {
    content: attr(data-label);
    color: #667085;
    font-size: 12px;
    text-align: left;
    flex-shrink: 0;
  }
  .table td.act {
    justify-content: flex-end;
    border-top: 1px solid #f2f4f7;
    margin-top: 4px;
    padding-top: 10px;
  }
  .table td.act::before {
    content: none;
  }
  .table td.empty {
    justify-content: center;
  }
  .table td.empty::before {
    content: none;
  }

  /* modal hampir selebar layar */
  .modal {
    width: calc(100vw - 32px);
    padding: 18px;
  }
}
.input {
  padding: 8px 10px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fff;
}
.input.full {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 12px;
}
.btn {
  background: var(--primary);
  color: #fff;
  border: 0;
  padding: 9px 16px;
  border-radius: 8px;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn.ghost {
  background: #fff;
  color: #1a1a1a;
  border: 1px solid #d0d5dd;
}
.table {
  width: 100%;
  background: #fff;
  border-collapse: collapse;
  border-radius: 10px;
  overflow: hidden;
}
.table th {
  text-align: left;
  font-size: 12px;
  color: #667085;
  padding: 12px 16px;
  border-bottom: 1px solid #eaecf0;
}
.table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f2f4f7;
}
.empty {
  text-align: center;
  color: #98a2b3;
}
.act {
  text-align: right;
}
.link {
  background: none;
  border: 0;
  color: var(--primary);
  cursor: pointer;
  margin-left: 8px;
}
.link.danger {
  color: #d92d20;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  width: 440px;
  max-height: 90vh;
  overflow: auto;
}
.modal label {
  display: block;
  font-weight: 600;
  margin: 8px 0 4px;
}
.modal small {
  font-weight: 400;
  color: #98a2b3;
  float: right;
}
.checks label {
  font-weight: 400;
  margin: 2px 0;
}
.row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.foot {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: #067647;
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
}
</style>
