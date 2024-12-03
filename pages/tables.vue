<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1>Restaurant Table Management</h1>

        <!--Create table button-->
        <v-btn color="primary" @click="dialog = true" class="mb-4">Add New Table</v-btn>

        <!--Table listings-->
        <v-data-table
          :headers="headers"
          :items="tables"
          item-value="id"
          class="elevation-1"
        >
          <template v-slot:[`item.actions`]="{ item }">
            <v-btn small color="success" @click="seatTable(item)" :disabled="item.status === 'Seated'">
              Seat
            </v-btn>
            <v-btn small color="info" @click="openReserveDialog(item)" :disabled="item.status === 'Reserved'">
              Reserve
            </v-btn>
            <v-btn small color="primary" @click="openOrderDialog(item)">
              Order
            </v-btn>
            <v-btn small color="error" @click="closeTable(item)">
              Close
            </v-btn>
            <v-btn small color="red" @click="deleteTable(item)">
              Delete
            </v-btn>
          </template>
          <template v-slot:[`item.timer`]="{ item }">
            {{ item.timer || "—" }}
          </template>
          <template v-slot:[`item.notes`]="{ item }">
            {{ item.notes || "No notes" }}
          </template>
          <template v-slot:[`item.orders`]="{ item }">
            {{ formatOrders(item.orders) }}
          </template>
          <template v-slot:[`item.totalCost`]="{ item }">
            ${{ calculateTotalCost(item.orders).toFixed(2) }}
          </template>
        </v-data-table>
      </v-col>
    </v-row>


    <!--Creating tables-->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Add New Table</span>
        </v-card-title>
        <v-card-text>
          <v-text-field label="Table Name" v-model="newTableName" required></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="saveTable">Save</v-btn>
          <v-btn color="secondary" @click="dialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <!--Reserving tables-->
    <v-dialog v-model="reserveDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Reserve Table</span>
        </v-card-title>
        <v-card-text>
          <v-text-field label="Reservation Name" v-model="reservationName" required></v-text-field>
          <v-text-field
            label="Reservation Time"
            v-model="reservationTime"
            placeholder="e.g., 7:00 PM"
            required
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="reserveTable">Save</v-btn>
          <v-btn color="secondary" @click="cancelReserve">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <!--Order system code (Don't even touch this anymore)-->
    <v-dialog v-model="orderDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Order for {{ currentTable?.name }}</span>
        </v-card-title>
        <v-card-text>
          <h3>Select Items</h3>
          <v-select
            label="Select Entree"
            :items="menu.entrees"
            item-text="name"
            item-value="name"
            v-model="selectedEntree"
            outlined
            dense
          ></v-select>
          <v-select
            label="Select Side"
            :items="menu.sides"
            item-text="name"
            item-value="name"
            v-model="selectedSide"
            outlined
            dense
          ></v-select>
          <v-select
            label="Select Drink"
            :items="menu.drinks"
            item-text="name"
            item-value="name"
            v-model="selectedDrink"
            outlined
            dense
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="addOrder">Add Items</v-btn>
          <v-btn color="secondary" @click="orderDialog = false">Done</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>


<script>
export default {
  data() {
    return {
      tables: [],
      headers: [
        { text: "Table Name", value: "name" },
        { text: "Status", value: "status" },
        { text: "Timer", value: "timer" },
        { text: "Notes", value: "notes" },
        { text: "Orders", value: "orders" },
        { text: "Total Cost", value: "totalCost" },
        { text: "Actions", value: "actions", sortable: false },
      ],
      dialog: false,
      newTableName: "",
      reserveDialog: false,
      currentTable: null,
      reservationName: "",
      reservationTime: "",
      orderDialog: false,
      selectedEntree: null,
      selectedSide: null,
      selectedDrink: null,
      menu: {
        entrees: [
          { name: "Burger", price: 13.99 },
          { name: "Chicken Sandwich", price: 13.99 },
          { name: "Steak", price: 24.99 },
          { name: "test entree", price: 999.99 },
        ],
        sides: [
          { name: "Fries", price: 4.99 },
          { name: "Mashed Potatoes", price: 3.99 },
          { name: "Vegetables", price: 1.99 },
          { name: "test side", price: 999.99 },
        ],
        drinks: [
          { name: "Soda", price: 2.99 },
          { name: "Water", price: 0 },
          { name: "Whiskey Business", price: 10.99 },
          { name: "Flowing Samoan", price: 9.99 },
          { name: "test drink", price: 999.99 },
        ],
      },
    };
  },
  methods: {
    fetchTables() {
      const savedTables = localStorage.getItem("tables");
      if (savedTables) {
        this.tables = JSON.parse(savedTables);
      }
    },
    saveTablesToLocalStorage() {
      localStorage.setItem("tables", JSON.stringify(this.tables));
    },
    saveTable() {
      const newTable = {
        id: Date.now(),
        name: this.newTableName,
        status: "Available",
        timer: null,
        timerStart: null,
        notes: "",
        orders: [],
      };
      this.tables.push(newTable);
      this.newTableName = "";
      this.dialog = false;

      this.saveTablesToLocalStorage();
    },
    seatTable(table) {
      table.status = "Seated";
      table.timerStart = Date.now();
      this.startTimer(table);
      this.saveTablesToLocalStorage();
    },
    startTimer(table) {
      table.timer = "0:00";
      const interval = setInterval(() => {
        if (table.status !== "Seated") {
          clearInterval(interval);
          return;
        }

        const elapsed = Math.floor((Date.now() - table.timerStart) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        table.timer = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
        this.saveTablesToLocalStorage();
      }, 1000);
    },
    openReserveDialog(table) {
      this.currentTable = table;
      this.reserveDialog = true;
    },
    reserveTable() {
      this.currentTable.status = "Reserved";
      this.currentTable.notes = `${this.reservationName} @ ${this.reservationTime}`;
      this.reserveDialog = false;
      this.saveTablesToLocalStorage();
    },
    deleteTable(table) {
      this.tables = this.tables.filter((t) => t.id !== table.id);
      this.saveTablesToLocalStorage();
    },
    openOrderDialog(table) {
      this.currentTable = table;
      this.selectedEntree = null;
      this.selectedSide = null;
      this.selectedDrink = null;
      this.orderDialog = true;
    },
    addOrder() {
      const newOrders = [];
      if (this.selectedEntree) {
        const entree = this.menu.entrees.find((item) => item.name === this.selectedEntree);
        newOrders.push({ name: entree.name, price: entree.price });
      }
      if (this.selectedSide) {
        const side = this.menu.sides.find((item) => item.name === this.selectedSide);
        newOrders.push({ name: side.name, price: side.price });
      }
      if (this.selectedDrink) {
        const drink = this.menu.drinks.find((item) => item.name === this.selectedDrink);
        newOrders.push({ name: drink.name, price: drink.price });
      }

      this.currentTable.orders.push(...newOrders);
      this.saveTablesToLocalStorage();

      this.selectedEntree = null;
      this.selectedSide = null;
      this.selectedDrink = null;
    },

    closeTable(table) {
      table.status = "Available";
      table.timer = null;
      table.timerStart = null;
      table.notes = "";
      table.orders = [];
      this.saveTablesToLocalStorage();
    },
    formatOrders(orders) {
      if (!orders.length) return "No orders yet";
      return orders.map((o) => `${o.name} ($${o.price})`).join(", ");
    },
    calculateTotalCost(orders) {
      return orders.reduce((sum, order) => sum + order.price, 0);
    },
  },
  mounted() {
    this.fetchTables();
  },
};
</script>

<style scoped>
h1 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}
</style>







