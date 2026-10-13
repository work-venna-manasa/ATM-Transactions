# ATM Transaction Management System Using Priority Scheduling Algorithm
> **Operating Systems (OS) Mini-Project & Academic Laboratory Demonstration Prototype**

---

## 📌 1. Project Overview & Problem Statement

### Overview
The **ATM Transaction Management System** is an interactive, web-based Operating Systems simulation that demonstrates how an automated teller machine (ATM) processor schedules and handles incoming transaction requests using the **Non-Preemptive Priority Scheduling Algorithm**.

### Problem Statement
In conventional ATM environments, multiple customers or automated background banking tasks queue up simultaneously. Different operations carry contrasting urgency levels, resource footprints, and computational overhead:
- A customer performing a critical Balance Inquiry or emergency Fund Transfer should not experience unnecessary latency behind long, hardware-intensive operations.
- Cash deposits and high-denomination withdrawals require mechanical bill counting and hardware verification, inherently commanding higher burst times.

Traditional First-Come, First-Served (FCFS) scheduling can lead to the **convoy effect**, where brief inquiries are delayed behind heavy operations. This simulation models an operating system CPU scheduler tailored for an ATM controller that prioritizes urgent transactions while deterministically breaking ties using FCFS.

### Core Objectives
1. **Model CPU Scheduling in Banking:** Simulate how an OS allocates CPU execution time to discrete banking operations.
2. **Implement Non-Preemptive Priority Scheduling:** Execute transactions strictly based on priority ranks (Priority 1 = Highest, Priority 2 = Medium, Priority 3 = Lowest).
3. **Deterministic Tie-Breaking:** Resolve equal-priority contentions using Arrival Time ($AT$) via FCFS, and preserve queue insertion order for identical arrival times.
4. **Account for CPU Idle Time:** Accurately identify and visualize time periods when the processor is waiting for transactions to arrive.
5. **Interactive Visualization:** Provide an animated ATM terminal screen, real-time ready queue visualizer, and dynamic Gantt chart.
6. **Mathematical Accuracy:** Compute Completion Time ($CT$), Turnaround Time ($TAT$), Waiting Time ($WT$), and system averages without rounding drift.

---

## 🧠 2. Operating Systems Concepts Used

1. **Process Management & Scheduling:** Transactions are treated as independent processes with distinct attributes: Process ID / Transaction ID, Burst Time ($BT$), and Arrival Time ($AT$).
2. **Ready Queue Management:** Newly arrived transactions enter the Ready Queue at time $t = AT$. The queue dynamically reorganizes based on priority.
3. **Non-Preemptive Execution:** Once a process transitions from `Ready` to `Running`, it retains control of the CPU until completion. High-priority processes that arrive during execution must wait in the Ready Queue.
4. **FCFS Tie-Breaking:** Resolves priority collisions using arrival timestamps.
5. **CPU Idle Periods:** When the Ready Queue is empty and remaining jobs have $AT > t_{\text{current}}$, the CPU executes an idle cycle until the next job arrives.
6. **Starvation & Aging:** Addresses the theoretical risk where Priority 3 jobs might wait indefinitely if higher-priority jobs arrive perpetually.

---

## 🎯 3. Priority Scheme & Scheduling Rules

### Priority Scheme
| Priority Level | Classification | ATM Transaction Types | Description |
|:---:|:---:|---|---|
| **Priority 1** | **Highest Priority** | Balance Inquiry, Fund Transfer | Security-sensitive, rapid query, or high-urgency interbank wire transfers. |
| **Priority 2** | **Medium Priority** | Cash Withdrawal, Mini Statement | Standard routine customer transactions at the terminal. |
| **Priority 3** | **Lowest Priority** | Cash Deposit | Hardware-intensive bill-counting and deposit verification. |

### Algorithmic Rules
1. **Highest Priority First:** Processes in the ready queue with a lower numerical priority value take precedence ($1 > 2 > 3$).
2. **Non-Preemption:** A running transaction cannot be interrupted by any newly arriving job.
3. **FCFS Tie-Breaker:** When priorities match, the job with the smaller Arrival Time ($AT$) executes first.
4. **Insertion Order Tie-Breaker:** When both priority and arrival time match, the original queue insertion order is maintained.
5. **Idle State Handling:** If no transactions are ready at time $t$, the clock advances directly to the next arrival time.

---

## 📝 4. Input Fields & Form Validation

The application allows users to add custom transactions with real-time client-side validation:

| Field Name | Type / Format | Validation Criteria | Default / Suggested Preset |
|---|---|---|---|
| **Customer Name** | Text | Required; minimum 2 characters; sanitized against XSS. | e.g., "John Doe" |
| **Transaction Type** | Dropdown | One of 5 predefined types. Auto-suggests typical burst times and priorities. | Cash Withdrawal |
| **Arrival Time ($AT$)** | Integer | Required; $\ge 0$ ms. | Next incremental timestamp |
| **Burst Time ($BT$)** | Integer | Required; $1 \le BT \le 100$ ms. | 2 ms to 5 ms based on type |
| **Priority Level** | Radio Select | Required; Choice of 1 (Highest), 2 (Medium), or 3 (Lowest). | Derived from transaction type |

---

## 📐 5. Mathematical Formulas & Worked Example

### Standard OS Formulas
- **Completion Time ($CT$):** Time at which the transaction finishes running.
- **Turnaround Time ($TAT$):**
  $$\text{Turnaround Time (TAT)} = CT - AT$$
- **Waiting Time ($WT$):**
  $$\text{Waiting Time (WT)} = TAT - BT$$
- **Average Waiting Time:**
  $$\text{Avg WT} = \frac{\sum_{i=1}^{N} WT_i}{N}$$
- **Average Turnaround Time:**
  $$\text{Avg TAT} = \frac{\sum_{i=1}^{N} TAT_i}{N}$$

---

### Step-by-Step Trace of Sample Transactions

| Tx ID | Customer Name | Transaction Type | Arrival Time ($AT$) | Burst Time ($BT$) | Priority ($P$) |
|:---:|:---:|---|:---:|:---:|:---:|
| **T1** | Alice Smith | Cash Withdrawal | 0 | 5 | 2 |
| **T2** | Bob Johnson | Balance Inquiry | 1 | 2 | 1 |
| **T3** | Charlie Davis | Cash Deposit | 2 | 4 | 3 |
| **T4** | Diana Prince | Fund Transfer | 3 | 3 | 1 |
| **T5** | Evan Wright | Mini Statement | 4 | 2 | 2 |
| **T6** | Fiona Gallagher | Cash Withdrawal | 5 | 4 | 3 |

#### Execution Trace:
1. **$t = 0$ ms:** T1 is the only arrived job ($AT=0$). Dispatched non-preemptively ($0 \rightarrow 5$ ms).
   - During execution, T2 ($t=1$), T3 ($t=2$), T4 ($t=3$), T5 ($t=4$), and T6 ($t=5$) arrive in the Ready Queue.
   - **T1 Finishes:** $CT = 5\text{ ms}$, $TAT = 5 - 0 = 5\text{ ms}$, $WT = 5 - 5 = 0\text{ ms}$.
2. **$t = 5$ ms:** Ready Queue: `[T2 (P1), T4 (P1), T5 (P2), T3 (P3), T6 (P3)]`.
   - Highest Priority = P1 (T2 & T4).
   - Tie-breaker FCFS: T2 ($AT=1$) arrived before T4 ($AT=3$). **T2 dispatched** ($5 \rightarrow 7$ ms).
   - **T2 Finishes:** $CT = 7\text{ ms}$, $TAT = 7 - 1 = 6\text{ ms}$, $WT = 6 - 2 = 4\text{ ms}$.
3. **$t = 7$ ms:** Ready Queue: `[T4 (P1), T5 (P2), T3 (P3), T6 (P3)]`.
   - Highest Priority = P1 (T4). **T4 dispatched** ($7 \rightarrow 10$ ms).
   - **T4 Finishes:** $CT = 10\text{ ms}$, $TAT = 10 - 3 = 7\text{ ms}$, $WT = 7 - 3 = 4\text{ ms}$.
4. **$t = 10$ ms:** Ready Queue: `[T5 (P2), T3 (P3), T6 (P3)]`.
   - Highest Priority = P2 (T5). **T5 dispatched** ($10 \rightarrow 12$ ms).
   - **T5 Finishes:** $CT = 12\text{ ms}$, $TAT = 12 - 4 = 8\text{ ms}$, $WT = 8 - 2 = 6\text{ ms}$.
5. **$t = 12$ ms:** Ready Queue: `[T3 (P3), T6 (P3)]`.
   - Both are P3. FCFS tie-breaker: T3 ($AT=2$) arrived before T6 ($AT=5$). **T3 dispatched** ($12 \rightarrow 16$ ms).
   - **T3 Finishes:** $CT = 16\text{ ms}$, $TAT = 16 - 2 = 14\text{ ms}$, $WT = 14 - 4 = 10\text{ ms}$.
6. **$t = 16$ ms:** Ready Queue: `[T6 (P3)]`.
   - **T6 dispatched** ($16 \rightarrow 20$ ms).
   - **T6 Finishes:** $CT = 20\text{ ms}$, $TAT = 20 - 5 = 15\text{ ms}$, $WT = 15 - 4 = 11\text{ ms}$.

#### Calculated Results Table

| Execution Order | Tx ID | Customer | Type | Priority | $AT$ | $BT$ | Start Time | $CT$ | $TAT$ | $WT$ |
|:---:|:---:|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **T1** | Alice Smith | Cash Withdrawal | P2 | 0 | 5 | 0 | 5 | 5 | 0 |
| 2 | **T2** | Bob Johnson | Balance Inquiry | P1 | 1 | 2 | 5 | 7 | 6 | 4 |
| 3 | **T4** | Diana Prince | Fund Transfer | P1 | 3 | 3 | 7 | 10 | 7 | 4 |
| 4 | **T5** | Evan Wright | Mini Statement | P2 | 4 | 2 | 10 | 12 | 8 | 6 |
| 5 | **T3** | Charlie Davis | Cash Deposit | P3 | 2 | 4 | 12 | 16 | 14 | 10 |
| 6 | **T6** | Fiona Gallagher | Cash Withdrawal | P3 | 5 | 4 | 16 | 20 | 15 | 11 |

#### Statistical Summary:
- **Total Execution Time:** $20\text{ ms}$
- **Average Turnaround Time:** $\frac{5 + 6 + 7 + 8 + 14 + 15}{6} = \frac{55}{6} \approx \mathbf{9.17\text{ ms}}$
- **Average Waiting Time:** $\frac{0 + 4 + 4 + 6 + 10 + 11}{6} = \frac{35}{6} \approx \mathbf{5.83\text{ ms}}$
- **CPU Utilization:** $100\%$ (zero idle intervals in this baseline scenario)

---

## 🛠️ 6. Technologies Used

- **HTML5:** Semantic markup, responsive dashboard layout, modal dialogs, accessible tables.
- **CSS3:** Custom properties (CSS variables), Flexbox, CSS Grid, animations (pulse, slide, fade), dark banking color scheme.
- **JavaScript (ES6+):** Pure client-side scheduling algorithm, discrete step simulator, DOM manipulation, CSV export engine.
- **Chart.js:** Responsive bar and doughnut charts for performance comparison and queue composition.
- **Font Awesome 6:** Iconography for banking operations, ATM hardware status, and control buttons.
- **Google Fonts:** Typography utilizing `Inter` for clean UI text and `JetBrains Mono` for tabular metrics and logs.

---

## 💻 7. How to Run the Project Locally

1. **Clone or Download the Repository:**
   ```bash
   git clone <YOUR_REPOSITORY_URL>
   cd atm-priority-scheduling
   ```
2. **Launch in Browser:**
   - Double-click `index.html` to open it in your default web browser (Edge, Chrome, Firefox, Safari).
   - Alternatively, open the directory in VS Code and use the **Live Server** extension.
3. **No Installation Required:** Zero build steps, npm packages, or server dependencies. The application operates 100% locally in-memory.

---

## 📸 8. Screenshots & User Interface Preview

### Dashboard & ATM Hardware Visualizer
The interface features a navy-blue banking dashboard layout with an animated ATM hardware screen, real-time clock indicator, and a ready queue visualizer showing pending operations ranked by priority.

### Interactive Gantt Chart
Visual execution timeline with color-coded priority blocks (Crimson = P1, Amber = P2, Sky Blue = P3, Striped Slate = Idle) and a live playhead indicator.

### Performance Analytics & Results
Side-by-side comparison bar charts visualizing Waiting Time vs. Turnaround Time per transaction, accompanied by a calculated summary table.

---

## ⚖️ 9. Academic Disclaimer

This application is an educational simulation developed specifically for demonstrating Operating Systems CPU Scheduling concepts. It does **not** connect to any real-world banking network, ATM hardware, or financial database.
