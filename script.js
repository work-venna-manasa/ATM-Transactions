/**
 * ATM TRANSACTION MANAGEMENT SYSTEM USING PRIORITY SCHEDULING ALGORITHM
 * Operating Systems Mini-Project Simulator
 * 
 * Non-Preemptive Priority Scheduling Engine:
 * - Priority 1 = Highest Priority
 * - Priority 2 = Medium Priority
 * - Priority 3 = Lowest Priority
 * - Tie-breaker: First-Come, First-Served (FCFS) based on Arrival Time
 * - Strict insertion order fallback for identical priority & arrival time
 * - CPU Idle detection & representation
 */

// =============================================================================
// 1. Initial State & Sample Data Configuration
// =============================================================================

const SAMPLE_TRANSACTIONS = [
    { id: 'T1', customer: 'Alice Smith', type: 'Cash Withdrawal', arrivalTime: 0, burstTime: 5, priority: 2 },
    { id: 'T2', customer: 'Bob Johnson', type: 'Balance Inquiry', arrivalTime: 1, burstTime: 2, priority: 1 },
    { id: 'T3', customer: 'Charlie Davis', type: 'Cash Deposit', arrivalTime: 2, burstTime: 4, priority: 3 },
    { id: 'T4', customer: 'Diana Prince', type: 'Fund Transfer', arrivalTime: 3, burstTime: 3, priority: 1 },
    { id: 'T5', customer: 'Evan Wright', type: 'Mini Statement', arrivalTime: 4, burstTime: 2, priority: 2 },
    { id: 'T6', customer: 'Fiona Gallagher', type: 'Cash Withdrawal', arrivalTime: 5, burstTime: 4, priority: 3 }
];

// Presets for transaction types when adding new transactions
const TYPE_PRESETS = {
    'Cash Withdrawal': { burst: 4, priority: 2, subtitle: 'Standard Cash Out' },
    'Balance Inquiry': { burst: 2, priority: 1, subtitle: 'Fast Account Inquiry' },
    'Cash Deposit': { burst: 4, priority: 3, subtitle: 'Automated Cash Deposit' },
    'Fund Transfer': { burst: 3, priority: 1, subtitle: 'Urgent Wire Transfer' },
    'Mini Statement': { burst: 2, priority: 2, subtitle: 'Recent Receipt Print' }
};

// Global Application State
const state = {
    transactions: [],             // Array of transaction objects
    scheduleTimeline: [],         // Array of scheduled execution blocks (TX & IDLE)
    results: [],                  // Calculated completion, TAT, WT per transaction
    summary: {
        avgWT: 0,
        avgTAT: 0,
        totalTime: 0,
        completedCount: 0,
        pendingCount: 0
    },
    simulation: {
        status: 'IDLE',           // 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED'
        currentTime: 0,           // Simulated clock (ms)
        timelineIndex: 0,         // Current block in scheduleTimeline
        blockProgress: 0,         // Progress within current block
        stepIntervalMs: 1000,     // Delay per step
        timerId: null,            // Timer handle for setInterval
        isStepping: false
    },
    filters: {
        search: '',
        type: 'ALL',
        priority: 'ALL',
        status: 'ALL'
    },
    charts: {
        wtTatChart: null,
        typeDistChart: null
    }
};

// =============================================================================
// 2. DOM Elements Selection
// =============================================================================

const DOM = {
    // Topbar & System Indicators
    simStatusPill: document.getElementById('simStatusPill'),
    simStatusText: document.getElementById('simStatusText'),
    cpuClockValue: document.getElementById('cpuClockValue'),
    sidebarTimeDisplay: document.getElementById('sidebarTimeDisplay'),

    // Control Buttons
    runSimulationBtn: document.getElementById('runSimulationBtn'),
    instantScheduleBtn: document.getElementById('instantScheduleBtn'),
    stepSimBtn: document.getElementById('stepSimBtn'),
    pauseResumeBtn: document.getElementById('pauseResumeBtn'),
    pauseResumeText: document.getElementById('pauseResumeText'),
    resetSimBtn: document.getElementById('resetSimBtn'),
    loadSampleBtn: document.getElementById('loadSampleBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    quickAddBtn: document.getElementById('quickAddBtn'),
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    exportResultsBtn: document.getElementById('exportResultsBtn'),
    clearLogBtn: document.getElementById('clearLogBtn'),
    speedButtons: document.querySelectorAll('.speed-btn'),

    // Metric Cards
    metricTotal: document.getElementById('metricTotal'),
    metricPending: document.getElementById('metricPending'),
    metricPendingPercent: document.getElementById('metricPendingPercent'),
    pendingProgressBar: document.getElementById('pendingProgressBar'),
    metricCompleted: document.getElementById('metricCompleted'),
    metricCompletedPercent: document.getElementById('metricCompletedPercent'),
    completedProgressBar: document.getElementById('completedProgressBar'),
    metricAvgWT: document.getElementById('metricAvgWT'),
    metricAvgTAT: document.getElementById('metricAvgTAT'),

    // ATM Machine Visualizer
    atmStateIdle: document.getElementById('atmStateIdle'),
    atmStateProcessing: document.getElementById('atmStateProcessing'),
    atmStateComplete: document.getElementById('atmStateComplete'),
    atmActiveTypeBadge: document.getElementById('atmActiveTypeBadge'),
    atmActiveId: document.getElementById('atmActiveId'),
    atmCustomerAvatar: document.getElementById('atmCustomerAvatar'),
    atmCustomerName: document.getElementById('atmCustomerName'),
    atmTxTypeSubtitle: document.getElementById('atmTxTypeSubtitle'),
    atmActivePriority: document.getElementById('atmActivePriority'),
    atmActiveBT: document.getElementById('atmActiveBT'),
    atmActiveAT: document.getElementById('atmActiveAT'),
    atmActiveElapsed: document.getElementById('atmActiveElapsed'),
    atmProgressPercent: document.getElementById('atmProgressPercent'),
    atmProgressBarFill: document.getElementById('atmProgressBarFill'),
    atmFinalAvgWT: document.getElementById('atmFinalAvgWT'),
    atmFinalAvgTAT: document.getElementById('atmFinalAvgTAT'),
    cardSlot: document.querySelector('.card-slot'),
    cashDispenser: document.querySelector('.cash-dispenser'),
    receiptPrinter: document.querySelector('.receipt-printer'),

    // Scheduler Decision & Queue & Log
    decisionReasonBox: document.getElementById('decisionReasonBox'),
    decisionReasonText: document.getElementById('decisionReasonText'),
    activeDecisionBadge: document.getElementById('activeDecisionBadge'),
    readyQueueCount: document.getElementById('readyQueueCount'),
    readyQueueList: document.getElementById('readyQueueList'),
    logTerminalWindow: document.getElementById('logTerminalWindow'),

    // Gantt Chart
    ganttTimelineContainer: document.getElementById('ganttTimelineContainer'),
    ganttSequencePills: document.getElementById('ganttSequencePills'),
    ganttTotalTime: document.getElementById('ganttTotalTime'),

    // Transaction Queue Table
    transactionTableBody: document.getElementById('transactionTableBody'),
    txSearchInput: document.getElementById('txSearchInput'),
    filterTypeSelect: document.getElementById('filterTypeSelect'),
    filterPrioritySelect: document.getElementById('filterPrioritySelect'),
    filterStatusSelect: document.getElementById('filterStatusSelect'),

    // Results Table
    resultsTableBody: document.getElementById('resultsTableBody'),
    resultsTableFoot: document.getElementById('resultsTableFoot'),
    resultsAvgTAT: document.getElementById('resultsAvgTAT'),
    resultsAvgWT: document.getElementById('resultsAvgWT'),

    // Modal & Form
    addTxModal: document.getElementById('addTxModal'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalCancelBtn: document.getElementById('modalCancelBtn'),
    addTxForm: document.getElementById('addTxForm'),
    inputCustomerName: document.getElementById('inputCustomerName'),
    inputTxType: document.getElementById('inputTxType'),
    inputArrivalTime: document.getElementById('inputArrivalTime'),
    inputBurstTime: document.getElementById('inputBurstTime'),
    formAlertBox: document.getElementById('formAlertBox'),
    formAlertMessage: document.getElementById('formAlertMessage'),
    toastContainer: document.getElementById('toastContainer'),

    // Sidebar navigation
    sidebar: document.getElementById('sidebar'),
    sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
    sidebarCloseBtn: document.getElementById('sidebarCloseBtn'),
    navItems: document.querySelectorAll('.nav-item')
};

// =============================================================================
// 3. Algorithm Implementation: Non-Preemptive Priority Scheduling
// =============================================================================

/**
 * Computes the complete deterministic execution timeline using Non-Preemptive Priority Scheduling.
 * 
 * Rules:
 * 1. Priority 1 = Highest, Priority 2 = Medium, Priority 3 = Lowest.
 * 2. Non-preemptive: Once a transaction begins, it runs until finished.
 * 3. Tie-breaker: FCFS (Arrival Time).
 * 4. Second tie-breaker: Original insertion order.
 * 5. Handles idle CPU periods when no transaction has arrived.
 * 
 * @param {Array} rawTransactions - List of transactions
 * @returns {Object} { timeline, calculatedResults, summary }
 */
function computePrioritySchedule(rawTransactions) {
    if (!rawTransactions || rawTransactions.length === 0) {
        return { timeline: [], calculatedResults: [], summary: { avgWT: 0, avgTAT: 0, totalTime: 0 } };
    }

    // Clone transactions and store original index for deterministic tie-breaking
    const txList = rawTransactions.map((tx, idx) => ({
        ...tx,
        originalIndex: idx,
        isCompleted: false,
        startTime: null,
        completionTime: null,
        turnaroundTime: null,
        waitingTime: null
    }));

    const timeline = [];
    let currentTime = 0;
    let completedCount = 0;
    const totalCount = txList.length;

    while (completedCount < totalCount) {
        // Find transactions that have arrived by currentTime and are not completed
        const readyQueue = txList.filter(tx => !tx.isCompleted && tx.arrivalTime <= currentTime);

        if (readyQueue.length === 0) {
            // CPU is IDLE! Find the earliest arrival time among remaining pending transactions
            const uncompleted = txList.filter(tx => !tx.isCompleted);
            const nextArrivalTime = Math.min(...uncompleted.map(tx => tx.arrivalTime));

            timeline.push({
                isIdle: true,
                start: currentTime,
                end: nextArrivalTime,
                duration: nextArrivalTime - currentTime,
                reason: `No transactions available in Ready Queue at T=${currentTime}ms. Simulated CPU enters IDLE until next arrival at T=${nextArrivalTime}ms.`,
                readyQueueSnapshot: []
            });

            currentTime = nextArrivalTime;
            continue;
        }

        // Sort ready queue by:
        // 1. Priority ascending (1 is highest, 3 is lowest)
        // 2. Arrival Time ascending (FCFS tie-break)
        // 3. Original insertion order ascending (deterministic fallback)
        readyQueue.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            if (a.arrivalTime !== b.arrivalTime) {
                return a.arrivalTime - b.arrivalTime;
            }
            return a.originalIndex - b.originalIndex;
        });

        // The chosen transaction is the first item in the sorted ready queue
        const selectedTx = readyQueue[0];
        const startTime = currentTime;
        const completionTime = startTime + selectedTx.burstTime;
        const turnaroundTime = completionTime - selectedTx.arrivalTime;
        const waitingTime = turnaroundTime - selectedTx.burstTime;

        // Build detailed OS scheduling reason for display
        let reason = '';
        if (readyQueue.length === 1) {
            reason = `At T=${startTime}ms, ${selectedTx.id} was the only transaction in Ready Queue (Priority ${selectedTx.priority}, Arrival T=${selectedTx.arrivalTime}ms).`;
        } else {
            const samePriorityPeers = readyQueue.filter(tx => tx.priority === selectedTx.priority && tx.id !== selectedTx.id);
            if (samePriorityPeers.length > 0) {
                reason = `At T=${startTime}ms, ${selectedTx.id} selected based on Priority ${selectedTx.priority}. Tied with ${samePriorityPeers.map(p => p.id).join(', ')}, resolved via FCFS (Arrival T=${selectedTx.arrivalTime}ms).`;
            } else {
                reason = `At T=${startTime}ms, ${selectedTx.id} had highest Priority ${selectedTx.priority} among ${readyQueue.length} ready transactions (${readyQueue.map(t => `${t.id}:P${t.priority}`).join(', ')}).`;
            }
        }

        // Snapshot of ready queue for step visualizer
        const queueSnapshot = readyQueue.map(t => ({
            id: t.id,
            customer: t.customer,
            priority: t.priority,
            arrivalTime: t.arrivalTime,
            burstTime: t.burstTime,
            type: t.type
        }));

        // Record timeline block
        timeline.push({
            isIdle: false,
            txId: selectedTx.id,
            customer: selectedTx.customer,
            type: selectedTx.type,
            priority: selectedTx.priority,
            arrivalTime: selectedTx.arrivalTime,
            burstTime: selectedTx.burstTime,
            start: startTime,
            end: completionTime,
            duration: selectedTx.burstTime,
            completionTime: completionTime,
            turnaroundTime: turnaroundTime,
            waitingTime: waitingTime,
            reason: reason,
            readyQueueSnapshot: queueSnapshot
        });

        // Mark transaction completed
        selectedTx.isCompleted = true;
        selectedTx.startTime = startTime;
        selectedTx.completionTime = completionTime;
        selectedTx.turnaroundTime = turnaroundTime;
        selectedTx.waitingTime = waitingTime;

        currentTime = completionTime;
        completedCount++;
    }

    // Sort calculated results in order of execution
    const calculatedResults = timeline
        .filter(block => !block.isIdle)
        .map((block, order) => ({
            order: order + 1,
            id: block.txId,
            customer: block.customer,
            type: block.type,
            priority: block.priority,
            arrivalTime: block.arrivalTime,
            burstTime: block.burstTime,
            startTime: block.start,
            completionTime: block.completionTime,
            turnaroundTime: block.turnaroundTime,
            waitingTime: block.waitingTime
        }));

    // Calculate aggregate metrics
    const totalWT = calculatedResults.reduce((sum, item) => sum + item.waitingTime, 0);
    const totalTAT = calculatedResults.reduce((sum, item) => sum + item.turnaroundTime, 0);
    const count = calculatedResults.length;

    const summary = {
        totalTime: currentTime,
        avgWT: count > 0 ? (totalWT / count).toFixed(2) : 0,
        avgTAT: count > 0 ? (totalTAT / count).toFixed(2) : 0
    };

    return { timeline, calculatedResults, summary };
}

// =============================================================================
// 4. Data Management & State Updates
// =============================================================================

/**
 * Loads the default project sample transactions into state
 */
function loadSampleDataset() {
    state.transactions = SAMPLE_TRANSACTIONS.map((tx, idx) => ({
        ...tx,
        status: 'Pending',
        originalIndex: idx,
        startTime: null,
        completionTime: null,
        turnaroundTime: null,
        waitingTime: null
    }));

    resetSimulationState();
    appendLog(`Loaded standard college project dataset (${state.transactions.length} transactions).`, 'info');
    showToast('Sample dataset loaded successfully', 'success');
}

/**
 * Resets the simulation without altering the transaction list
 */
function resetSimulationState() {
    stopSimulationTimer();

    state.simulation.status = 'IDLE';
    state.simulation.currentTime = 0;
    state.simulation.timelineIndex = 0;
    state.simulation.blockProgress = 0;
    state.simulation.isStepping = false;

    // Reset status of all transactions
    state.transactions.forEach(tx => {
        tx.status = 'Pending';
        tx.startTime = null;
        tx.completionTime = null;
        tx.turnaroundTime = null;
        tx.waitingTime = null;
    });

    // Recompute schedule to prepare timeline
    const computed = computePrioritySchedule(state.transactions);
    state.scheduleTimeline = computed.timeline;
    state.results = computed.calculatedResults;
    state.summary.avgWT = computed.summary.avgWT;
    state.summary.avgTAT = computed.summary.avgTAT;
    state.summary.totalTime = computed.summary.totalTime;

    updateMetricCards();
    updateATMHardwareIdle();
    renderTransactionTable();
    renderResultsTable(false); // clear / hide results until run
    renderGanttChart();
    updateReadyQueueUI([]);
    updateDecisionBox('Simulation is currently reset and idle. Click "Run Scheduling" to animate or "Instant Compute" to see immediate results.', 'Ready');

    updateSimulationStatusUI('IDLE / READY');
    DOM.cpuClockValue.textContent = 'T = 0 ms';
    DOM.sidebarTimeDisplay.textContent = 'Simulated Time: 0 ms';

    DOM.runSimulationBtn.disabled = false;
    DOM.stepSimBtn.disabled = false;
    DOM.pauseResumeBtn.disabled = true;
    DOM.pauseResumeText.textContent = 'Pause';
    DOM.pauseResumeBtn.querySelector('i').className = 'fa-solid fa-pause';

    updateAnalyticsCharts();
}

/**
 * Clears all transactions from memory
 */
function clearAllTransactions() {
    stopSimulationTimer();
    state.transactions = [];
    state.scheduleTimeline = [];
    state.results = [];
    state.summary = { avgWT: 0, avgTAT: 0, totalTime: 0, completedCount: 0, pendingCount: 0 };

    resetSimulationState();
    appendLog('Transaction queue cleared.', 'info');
    showToast('All transactions removed', 'info');
}

// =============================================================================
// 5. Simulation Runner & Step-by-Step Engine
// =============================================================================

/**
 * Starts running the animated simulation from the beginning or resumes
 */
function startSimulation() {
    if (state.transactions.length === 0) {
        showToast('No transactions in queue. Add or load sample transactions.', 'error');
        return;
    }

    if (state.simulation.status === 'COMPLETED') {
        resetSimulationState();
    }

    state.simulation.status = 'RUNNING';
    updateSimulationStatusUI('RUNNING');

    DOM.runSimulationBtn.disabled = true;
    DOM.stepSimBtn.disabled = true;
    DOM.pauseResumeBtn.disabled = false;
    DOM.pauseResumeText.textContent = 'Pause';
    DOM.pauseResumeBtn.querySelector('i').className = 'fa-solid fa-pause';

    appendLog(`Priority Scheduling simulation started at ${state.simulation.stepIntervalMs}ms per cycle.`, 'dispatch');

    stopSimulationTimer();
    state.simulation.timerId = setInterval(() => {
        executeSimulationCycle();
    }, state.simulation.stepIntervalMs);
}

/**
 * Pauses or resumes an active simulation
 */
function togglePauseSimulation() {
    if (state.simulation.status === 'RUNNING') {
        stopSimulationTimer();
        state.simulation.status = 'PAUSED';
        updateSimulationStatusUI('PAUSED');
        DOM.pauseResumeText.textContent = 'Resume';
        DOM.pauseResumeBtn.querySelector('i').className = 'fa-solid fa-play';
        DOM.stepSimBtn.disabled = false;
        appendLog('Simulation paused by user.', 'info');
    } else if (state.simulation.status === 'PAUSED') {
        state.simulation.status = 'RUNNING';
        updateSimulationStatusUI('RUNNING');
        DOM.pauseResumeText.textContent = 'Pause';
        DOM.pauseResumeBtn.querySelector('i').className = 'fa-solid fa-pause';
        DOM.stepSimBtn.disabled = true;
        appendLog('Simulation resumed.', 'info');

        state.simulation.timerId = setInterval(() => {
            executeSimulationCycle();
        }, state.simulation.stepIntervalMs);
    }
}

/**
 * Executes a single discrete scheduling step
 */
function stepSimulation() {
    if (state.transactions.length === 0) {
        showToast('No transactions in queue.', 'error');
        return;
    }

    if (state.simulation.status === 'COMPLETED') {
        resetSimulationState();
    }

    stopSimulationTimer();
    state.simulation.status = 'PAUSED';
    updateSimulationStatusUI('STEPPING');
    DOM.pauseResumeBtn.disabled = false;
    DOM.pauseResumeText.textContent = 'Resume';
    DOM.pauseResumeBtn.querySelector('i').className = 'fa-solid fa-play';

    executeSimulationCycle();
}

/**
 * Core cycle execution: Advances one block or sub-step in the schedule
 */
function executeSimulationCycle() {
    if (state.simulation.timelineIndex >= state.scheduleTimeline.length) {
        completeSimulation();
        return;
    }

    const currentBlock = state.scheduleTimeline[state.simulation.timelineIndex];

    // Update Simulated Time
    state.simulation.currentTime = currentBlock.end;
    DOM.cpuClockValue.textContent = `T = ${state.simulation.currentTime} ms`;
    DOM.sidebarTimeDisplay.textContent = `Simulated Time: ${state.simulation.currentTime} ms`;

    // Process Idle vs Transaction block
    if (currentBlock.isIdle) {
        handleIdleBlockExecution(currentBlock);
    } else {
        handleTransactionBlockExecution(currentBlock);
    }

    // Update playhead on Gantt Chart
    updateGanttPlayhead(currentBlock.end);

    // Advance timeline block index
    state.simulation.timelineIndex++;

    // Check if simulation completed
    if (state.simulation.timelineIndex >= state.scheduleTimeline.length) {
        completeSimulation();
    }
}

/**
 * Handles execution visuals for a CPU Idle block
 */
function handleIdleBlockExecution(block) {
    updateDecisionBox(block.reason, 'IDLE PERIOD');
    updateReadyQueueUI([]);

    DOM.atmStateIdle.classList.remove('hidden');
    DOM.atmStateProcessing.classList.add('hidden');
    DOM.atmStateComplete.classList.add('hidden');

    DOM.atmStateIdle.querySelector('h3').textContent = 'CPU IDLE STATE';
    DOM.atmStateIdle.querySelector('p').textContent = `No transaction arrived. Advancing time to ${block.end} ms.`;

    deactivateAtmSlots();
    appendLog(`[Time ${block.start} - ${block.end}ms] CPU IDLE. Waiting for transaction arrival.`, 'idle');
}

/**
 * Handles execution visuals for a real transaction
 */
function handleTransactionBlockExecution(block) {
    // 1. Update Transaction state
    const tx = state.transactions.find(t => t.id === block.txId);
    if (tx) {
        tx.status = 'Completed';
        tx.startTime = block.start;
        tx.completionTime = block.end;
        tx.turnaroundTime = block.turnaroundTime;
        tx.waitingTime = block.waitingTime;
    }

    // 2. Mark any remaining transactions as 'Ready' if they have arrived
    state.transactions.forEach(t => {
        if (t.status === 'Pending' && t.arrivalTime <= block.end) {
            t.status = 'Ready';
        }
    });

    // 3. Update Decision & Ready Queue UI
    updateDecisionBox(block.reason, `Dispatching ${block.txId}`);
    updateReadyQueueUI(block.readyQueueSnapshot);

    // 4. Update ATM Machine Screen
    updateATMHardwareProcessing(block);

    // 5. Update Tables & Metrics
    renderTransactionTable();
    renderResultsTable(true);
    updateMetricCards();
    updateAnalyticsCharts();

    // 6. Append OS Log
    appendLog(`[Time ${block.start}ms] Dispatched ${block.txId} (${block.type}) - Priority: P${block.priority}.`, 'dispatch');
    appendLog(`[Time ${block.end}ms] Completed ${block.txId}. CT=${block.end}ms, TAT=${block.turnaroundTime}ms, WT=${block.waitingTime}ms.`, 'complete');
}

/**
 * Completes the scheduling run
 */
function completeSimulation() {
    stopSimulationTimer();
    state.simulation.status = 'COMPLETED';
    updateSimulationStatusUI('COMPLETED');

    DOM.runSimulationBtn.disabled = false;
    DOM.stepSimBtn.disabled = true;
    DOM.pauseResumeBtn.disabled = true;

    // Show ATM Final Success Screen
    DOM.atmStateIdle.classList.add('hidden');
    DOM.atmStateProcessing.classList.add('hidden');
    DOM.atmStateComplete.classList.remove('hidden');

    DOM.atmFinalAvgWT.textContent = `${state.summary.avgWT} ms`;
    DOM.atmFinalAvgTAT.textContent = `${state.summary.avgTAT} ms`;

    deactivateAtmSlots();
    updateDecisionBox(`All ${state.transactions.length} transactions executed successfully! Average Waiting Time = ${state.summary.avgWT} ms, Average Turnaround Time = ${state.summary.avgTAT} ms.`, 'COMPLETED');
    updateReadyQueueUI([]);

    appendLog(`[Complete] All transactions scheduled. Total Execution Time: ${state.summary.totalTime}ms. Avg WT: ${state.summary.avgWT}ms, Avg TAT: ${state.summary.avgTAT}ms.`, 'complete');
    showToast('Priority Scheduling completed successfully!', 'success');
}

/**
 * Computes all calculations immediately without animation delay
 */
function instantSchedule() {
    if (state.transactions.length === 0) {
        showToast('No transactions in queue.', 'error');
        return;
    }

    stopSimulationTimer();
    const computed = computePrioritySchedule(state.transactions);
    state.scheduleTimeline = computed.timeline;
    state.results = computed.calculatedResults;
    state.summary.avgWT = computed.summary.avgWT;
    state.summary.avgTAT = computed.summary.avgTAT;
    state.summary.totalTime = computed.summary.totalTime;

    // Mark all transactions as completed
    state.transactions.forEach(tx => {
        const res = state.results.find(r => r.id === tx.id);
        if (res) {
            tx.status = 'Completed';
            tx.startTime = res.startTime;
            tx.completionTime = res.completionTime;
            tx.turnaroundTime = res.turnaroundTime;
            tx.waitingTime = res.waitingTime;
        }
    });

    state.simulation.currentTime = state.summary.totalTime;
    state.simulation.timelineIndex = state.scheduleTimeline.length;

    DOM.cpuClockValue.textContent = `T = ${state.summary.totalTime} ms`;
    DOM.sidebarTimeDisplay.textContent = `Simulated Time: ${state.summary.totalTime} ms`;

    renderTransactionTable();
    renderResultsTable(true);
    renderGanttChart();
    updateGanttPlayhead(state.summary.totalTime);
    updateMetricCards();
    updateAnalyticsCharts();

    completeSimulation();
    showToast('Instant calculation complete!', 'info');
}

/**
 * Stops any running timer
 */
function stopSimulationTimer() {
    if (state.simulation.timerId) {
        clearInterval(state.simulation.timerId);
        state.simulation.timerId = null;
    }
}

// =============================================================================
// 6. UI Renderers: ATM Terminal, Gantt Chart, Tables, Metrics
// =============================================================================

/**
 * Updates the ATM terminal screen to idle state
 */
function updateATMHardwareIdle() {
    DOM.atmStateIdle.classList.remove('hidden');
    DOM.atmStateProcessing.classList.add('hidden');
    DOM.atmStateComplete.classList.add('hidden');

    DOM.atmStateIdle.querySelector('h3').textContent = 'ATM SYSTEM READY';
    DOM.atmStateIdle.querySelector('p').textContent = 'Awaiting transaction scheduling execution...';
    deactivateAtmSlots();
}

/**
 * Updates the ATM terminal during transaction processing
 */
function updateATMHardwareProcessing(block) {
    DOM.atmStateIdle.classList.add('hidden');
    DOM.atmStateProcessing.classList.remove('hidden');
    DOM.atmStateComplete.classList.add('hidden');

    DOM.atmActiveTypeBadge.textContent = block.type.toUpperCase();
    DOM.atmActiveId.textContent = block.txId;

    // Initials avatar
    const initials = block.customer.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    DOM.atmCustomerAvatar.textContent = initials;
    DOM.atmCustomerName.textContent = block.customer;
    DOM.atmTxTypeSubtitle.textContent = TYPE_PRESETS[block.type]?.subtitle || block.type;

    const pLabels = { 1: 'P1 (Highest)', 2: 'P2 (Medium)', 3: 'P3 (Lowest)' };
    DOM.atmActivePriority.textContent = pLabels[block.priority] || `P${block.priority}`;
    DOM.atmActiveBT.textContent = `${block.burstTime} ms`;
    DOM.atmActiveAT.textContent = `${block.arrivalTime} ms`;
    DOM.atmActiveElapsed.textContent = `${block.burstTime} / ${block.burstTime} ms`;

    DOM.atmProgressPercent.textContent = '100%';
    DOM.atmProgressBarFill.style.width = '100%';

    // Physical slots animation triggers based on type
    deactivateAtmSlots();
    DOM.cardSlot.classList.add('active');

    if (block.type === 'Cash Withdrawal' || block.type === 'Cash Deposit') {
        DOM.cashDispenser.classList.add('active');
    } else if (block.type === 'Mini Statement' || block.type === 'Balance Inquiry') {
        DOM.receiptPrinter.classList.add('active');
    }
}

/**
 * Deactivates ATM slot animations
 */
function deactivateAtmSlots() {
    DOM.cardSlot.classList.remove('active');
    DOM.cashDispenser.classList.remove('active');
    DOM.receiptPrinter.classList.remove('active');
}

/**
 * Updates the Decision Reason Callout Box
 */
function updateDecisionBox(reasonText, badgeLabel = 'OS Decision') {
    DOM.decisionReasonText.innerHTML = reasonText;
    DOM.activeDecisionBadge.textContent = badgeLabel;
}

/**
 * Updates the Ready Queue visual pills
 */
function updateReadyQueueUI(queueItems) {
    DOM.readyQueueCount.textContent = `${queueItems.length} Waiting`;

    if (!queueItems || queueItems.length === 0) {
        DOM.readyQueueList.innerHTML = '<div class="empty-queue-msg">Ready queue is currently empty.</div>';
        return;
    }

    DOM.readyQueueList.innerHTML = queueItems.map(item => `
        <div class="rq-item-pill rq-p${item.priority}">
            <span class="rq-tx-id">${item.id}</span>
            <span class="rq-p-tag">P${item.priority}</span>
            <span class="rq-at-bt">AT:${item.arrivalTime} BT:${item.burstTime}</span>
        </div>
    `).join('');
}

/**
 * Updates the 5 Main Summary Metric Cards
 */
function updateMetricCards() {
    const total = state.transactions.length;
    const completed = state.transactions.filter(t => t.status === 'Completed').length;
    const pending = total - completed;

    DOM.metricTotal.textContent = total;
    DOM.metricPending.textContent = pending;
    DOM.metricCompleted.textContent = completed;

    const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const pendingPercent = total > 0 ? Math.round((pending / total) * 100) : 0;

    DOM.metricCompletedPercent.textContent = `${completedPercent}%`;
    DOM.completedProgressBar.style.width = `${completedPercent}%`;

    DOM.metricPendingPercent.textContent = `${pendingPercent}%`;
    DOM.pendingProgressBar.style.width = `${pendingPercent}%`;

    DOM.metricAvgWT.textContent = state.summary.avgWT !== undefined ? state.summary.avgWT : '--';
    DOM.metricAvgTAT.textContent = state.summary.avgTAT !== undefined ? state.summary.avgTAT : '--';
}

/**
 * Renders the Visual Gantt Chart Timeline
 */
function renderGanttChart() {
    if (!state.scheduleTimeline || state.scheduleTimeline.length === 0) {
        DOM.ganttTimelineContainer.innerHTML = `
            <div class="gantt-empty-state">
                <i class="fa-solid fa-timeline"></i>
                <p>Gantt Chart will render here once scheduling is run.</p>
            </div>
        `;
        DOM.ganttSequencePills.innerHTML = '';
        DOM.ganttTotalTime.textContent = 'Total Execution Time: 0 ms';
        return;
    }

    const totalDuration = state.summary.totalTime || 1;
    DOM.ganttTotalTime.textContent = `Total Execution Time: ${totalDuration} ms`;

    // Construct Timeline Track HTML
    let blocksHtml = '<div class="gantt-timeline-track" id="ganttTrack">';
    let ticksHtml = '<div class="gantt-scale-track">';
    let sequencePillsHtml = '';

    // Add initial 0ms scale tick
    ticksHtml += `
        <div class="gantt-scale-tick" style="left: 0%;">
            <div class="tick-line"></div>
            <span class="tick-value">0</span>
        </div>
    `;

    state.scheduleTimeline.forEach((block, index) => {
        const widthPercent = ((block.duration / totalDuration) * 100).toFixed(2);
        const blockClass = block.isIdle ? 'idle-block' : `p${block.priority}-block`;
        const titleText = block.isIdle 
            ? `IDLE: ${block.start}ms - ${block.end}ms (${block.duration}ms)` 
            : `${block.txId} (${block.customer}): Start ${block.start}ms, End ${block.end}ms, Burst ${block.duration}ms, Priority P${block.priority}`;

        blocksHtml += `
            <div class="gantt-block ${blockClass}" style="width: ${widthPercent}%;" title="${titleText}">
                <span class="gantt-block-id">${block.isIdle ? 'IDLE' : block.txId}</span>
                <span class="gantt-block-sub">${block.isIdle ? `${block.duration}ms` : block.type}</span>
            </div>
        `;

        // Scale tick for the end of this block
        const rightPercent = ((block.end / totalDuration) * 100).toFixed(2);
        ticksHtml += `
            <div class="gantt-scale-tick" style="left: ${rightPercent}%;">
                <div class="tick-line"></div>
                <span class="tick-value">${block.end}</span>
            </div>
        `;

        // Sequence pills
        sequencePillsHtml += `
            <span class="seq-pill">
                <strong>${block.isIdle ? 'IDLE' : block.txId}</strong> 
                <span class="text-muted">(${block.start}-${block.end}ms)</span>
            </span>
            ${index < state.scheduleTimeline.length - 1 ? '<i class="fa-solid fa-arrow-right seq-arrow"></i>' : ''}
        `;
    });

    // Playhead element
    blocksHtml += `<div class="gantt-playhead" id="ganttPlayhead" style="left: 0%;"></div>`;
    blocksHtml += '</div>';
    ticksHtml += '</div>';

    DOM.ganttTimelineContainer.innerHTML = blocksHtml + ticksHtml;
    DOM.ganttSequencePills.innerHTML = sequencePillsHtml;
}

/**
 * Moves the Gantt chart playhead scrubber to reflect current time
 */
function updateGanttPlayhead(currentTime) {
    const playhead = document.getElementById('ganttPlayhead');
    if (!playhead || !state.summary.totalTime) return;

    const percent = Math.min(100, Math.max(0, (currentTime / state.summary.totalTime) * 100));
    playhead.style.left = `${percent}%`;
}

/**
 * Renders the Transaction Queue Table with filtering and searching
 */
function renderTransactionTable() {
    const filtered = state.transactions.filter(tx => {
        // Search Filter (ID or Customer)
        const matchSearch = state.filters.search === '' || 
            tx.id.toLowerCase().includes(state.filters.search) || 
            tx.customer.toLowerCase().includes(state.filters.search);

        // Type Filter
        const matchType = state.filters.type === 'ALL' || tx.type === state.filters.type;

        // Priority Filter
        const matchPriority = state.filters.priority === 'ALL' || tx.priority.toString() === state.filters.priority;

        // Status Filter
        const matchStatus = state.filters.status === 'ALL' || tx.status === state.filters.status;

        return matchSearch && matchType && matchPriority && matchStatus;
    });

    if (filtered.length === 0) {
        DOM.transactionTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted" style="padding: 24px;">
                    No transactions match current filters.
                </td>
            </tr>
        `;
        return;
    }

    const typeIcons = {
        'Cash Withdrawal': 'fa-money-bill-wave text-emerald',
        'Cash Deposit': 'fa-vault text-blue',
        'Balance Inquiry': 'fa-magnifying-glass-dollar text-cyan',
        'Fund Transfer': 'fa-arrow-right-arrow-left text-purple',
        'Mini Statement': 'fa-receipt text-amber'
    };

    DOM.transactionTableBody.innerHTML = filtered.map(tx => {
        const isRunning = tx.status === 'Processing';
        const trClass = isRunning ? 'active-running' : '';
        const priorityLabels = { 1: 'P1 (High)', 2: 'P2 (Med)', 3: 'P3 (Low)' };

        return `
            <tr class="${trClass}">
                <td><code>${tx.id}</code></td>
                <td><strong>${escapeHtml(tx.customer)}</strong></td>
                <td>
                    <span class="type-badge">
                        <i class="fa-solid ${typeIcons[tx.type] || 'fa-credit-card'}"></i>
                        ${escapeHtml(tx.type)}
                    </span>
                </td>
                <td><code>${tx.arrivalTime} ms</code></td>
                <td><code>${tx.burstTime} ms</code></td>
                <td>
                    <span class="priority-tag p${tx.priority}-tag">
                        ${priorityLabels[tx.priority]}
                    </span>
                </td>
                <td>
                    <span class="status-pill ${tx.status.toLowerCase()}">
                        <span class="pill-dot"></span> ${tx.status}
                    </span>
                </td>
                <td>
                    <button class="btn-action-del" data-id="${tx.id}" title="Delete transaction">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // Attach delete listeners
    DOM.transactionTableBody.querySelectorAll('.btn-action-del').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const txId = e.currentTarget.getAttribute('data-id');
            deleteTransaction(txId);
        });
    });
}

/**
 * Renders the Calculated Results Table
 */
function renderResultsTable(showResults = true) {
    if (!showResults || !state.results || state.results.length === 0) {
        DOM.resultsTableBody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center text-muted">
                    Run the Priority Scheduling algorithm to generate calculated metrics.
                </td>
            </tr>
        `;
        DOM.resultsTableFoot.classList.add('hidden');
        return;
    }

    DOM.resultsTableBody.innerHTML = state.results.map(res => `
        <tr>
            <td><code>#${res.order}</code></td>
            <td><code>${res.id}</code></td>
            <td><strong>${escapeHtml(res.customer)}</strong></td>
            <td>${escapeHtml(res.type)}</td>
            <td><span class="priority-tag p${res.priority}-tag">P${res.priority}</span></td>
            <td><code>${res.arrivalTime}</code></td>
            <td><code>${res.burstTime}</code></td>
            <td><code>${res.startTime}</code></td>
            <td><code>${res.completionTime}</code></td>
            <td><strong class="text-emerald"><code>${res.turnaroundTime}</code></strong></td>
            <td><strong class="text-cyan"><code>${res.waitingTime}</code></strong></td>
        </tr>
    `).join('');

    DOM.resultsTableFoot.classList.remove('hidden');
    DOM.resultsAvgTAT.innerHTML = `<code>${state.summary.avgTAT} ms</code>`;
    DOM.resultsAvgWT.innerHTML = `<code>${state.summary.avgWT} ms</code>`;
}

/**
 * Appends a message to the OS event log terminal
 */
function appendLog(message, type = 'info') {
    const logLine = document.createElement('div');
    logLine.className = `log-line ${type}`;
    logLine.textContent = message;
    DOM.logTerminalWindow.appendChild(logLine);
    DOM.logTerminalWindow.scrollTop = DOM.logTerminalWindow.scrollHeight;
}

/**
 * Updates the status pill indicator in the topbar
 */
function updateSimulationStatusUI(statusText) {
    DOM.simStatusText.textContent = statusText;
    DOM.simStatusPill.className = `simulation-status-pill ${statusText.toLowerCase()}`;
}

// =============================================================================
// 7. Performance Analytics & Chart.js Integration
// =============================================================================

/**
 * Updates or renders Chart.js analytics graphs
 */
function updateAnalyticsCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js CDN not available; skipping analytics chart rendering.');
        return;
    }

    renderWTTATChart();
    renderTypeDistChart();
}

/**
 * Chart 1: Bar chart comparing Waiting Time (WT) & Turnaround Time (TAT)
 */
function renderWTTATChart() {
    const canvas = document.getElementById('chartWTTAT');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = state.results.length > 0 
        ? state.results.map(r => r.id) 
        : state.transactions.map(t => t.id);

    const wtData = state.results.length > 0 
        ? state.results.map(r => r.waitingTime) 
        : state.transactions.map(() => 0);

    const tatData = state.results.length > 0 
        ? state.results.map(r => r.turnaroundTime) 
        : state.transactions.map(() => 0);

    if (state.charts.wtTatChart) {
        state.charts.wtTatChart.data.labels = labels;
        state.charts.wtTatChart.data.datasets[0].data = wtData;
        state.charts.wtTatChart.data.datasets[1].data = tatData;
        state.charts.wtTatChart.update();
        return;
    }

    state.charts.wtTatChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Waiting Time (WT)',
                    data: wtData,
                    backgroundColor: 'rgba(6, 182, 212, 0.7)',
                    borderColor: '#06b6d4',
                    borderWidth: 1.5,
                    borderRadius: 4
                },
                {
                    label: 'Turnaround Time (TAT)',
                    data: tatData,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10b981',
                    borderWidth: 1.5,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
                },
                tooltip: {
                    backgroundColor: '#091021',
                    borderColor: '#1e2c4d',
                    borderWidth: 1,
                    titleColor: '#fff',
                    bodyColor: '#cbd5e1'
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' },
                    beginAtZero: true,
                    title: { display: true, text: 'Time in ms', color: '#64748b' }
                }
            }
        }
    });
}

/**
 * Chart 2: Doughnut chart showing Transaction Types Distribution
 */
function renderTypeDistChart() {
    const canvas = document.getElementById('chartTypeDist');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const counts = {
        'Cash Withdrawal': 0,
        'Cash Deposit': 0,
        'Balance Inquiry': 0,
        'Fund Transfer': 0,
        'Mini Statement': 0
    };

    state.transactions.forEach(t => {
        if (counts[t.type] !== undefined) counts[t.type]++;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    if (state.charts.typeDistChart) {
        state.charts.typeDistChart.data.datasets[0].data = data;
        state.charts.typeDistChart.update();
        return;
    }

    state.charts.typeDistChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#10b981', // Emerald
                    '#3b82f6', // Blue
                    '#06b6d4', // Cyan
                    '#8b5cf6', // Purple
                    '#f59e0b'  // Amber
                ],
                borderWidth: 2,
                borderColor: '#121c33'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: 'Inter', size: 10 }, boxWidth: 12 }
                }
            },
            cutout: '65%'
        }
    });
}

// =============================================================================
// 8. Transaction Management & Modal Handling
// =============================================================================

/**
 * Deletes a transaction by ID
 */
function deleteTransaction(txId) {
    const index = state.transactions.findIndex(t => t.id === txId);
    if (index !== -1) {
        const removed = state.transactions.splice(index, 1)[0];
        appendLog(`Deleted transaction ${removed.id} (${removed.customer}).`, 'info');
        resetSimulationState();
        showToast(`Transaction ${removed.id} deleted`, 'info');
    }
}

/**
 * Opens the Add Transaction Modal
 */
function openAddTransactionModal() {
    DOM.addTxForm.reset();
    DOM.formAlertBox.classList.add('hidden');
    clearFieldErrors();

    // Default suggestions
    DOM.inputCustomerName.value = '';
    DOM.inputTxType.value = 'Cash Withdrawal';
    applyTypePreset('Cash Withdrawal');

    // Auto calculate arrival time suggestions based on last transaction
    const lastAT = state.transactions.length > 0 
        ? Math.max(...state.transactions.map(t => t.arrivalTime)) + 1 
        : 0;
    DOM.inputArrivalTime.value = lastAT;

    DOM.addTxModal.classList.add('open');
    DOM.inputCustomerName.focus();
}

/**
 * Closes the Add Transaction Modal
 */
function closeAddTransactionModal() {
    DOM.addTxModal.classList.remove('open');
}

/**
 * Applies burst time and priority presets based on transaction type
 */
function applyTypePreset(type) {
    const preset = TYPE_PRESETS[type];
    if (preset) {
        DOM.inputBurstTime.value = preset.burst;
        const radio = document.querySelector(`input[name="priorityRadio"][value="${preset.priority}"]`);
        if (radio) radio.checked = true;
    }
}

/**
 * Handles submission of the Add Transaction form with thorough validation
 */
function handleAddTransactionSubmit(e) {
    e.preventDefault();
    clearFieldErrors();

    const customerName = DOM.inputCustomerName.value.trim();
    const type = DOM.inputTxType.value;
    const arrivalTime = parseInt(DOM.inputArrivalTime.value, 10);
    const burstTime = parseInt(DOM.inputBurstTime.value, 10);
    const priorityRadio = document.querySelector('input[name="priorityRadio"]:checked');
    const priority = priorityRadio ? parseInt(priorityRadio.value, 10) : 2;

    let hasErrors = false;

    if (!customerName || customerName.length < 2) {
        showFieldError('errCustomerName', 'Please enter a valid customer name (min 2 chars).');
        hasErrors = true;
    }

    if (isNaN(arrivalTime) || arrivalTime < 0) {
        showFieldError('errArrivalTime', 'Arrival Time must be a non-negative integer (>= 0).');
        hasErrors = true;
    }

    if (isNaN(burstTime) || burstTime <= 0 || burstTime > 100) {
        showFieldError('errBurstTime', 'Burst Time must be between 1 and 100 ms.');
        hasErrors = true;
    }

    if (![1, 2, 3].includes(priority)) {
        showFieldError('errPriority', 'Please select a valid Priority level (1, 2, or 3).');
        hasErrors = true;
    }

    if (hasErrors) {
        DOM.formAlertBox.classList.remove('hidden');
        DOM.formAlertMessage.textContent = 'Please correct the highlighted form errors before continuing.';
        return;
    }

    // Generate unique ID
    let nextNum = 1;
    const existingIds = new Set(state.transactions.map(t => t.id));
    while (existingIds.has(`T${nextNum}`)) {
        nextNum++;
    }
    const newId = `T${nextNum}`;

    const newTx = {
        id: newId,
        customer: customerName,
        type: type,
        arrivalTime: arrivalTime,
        burstTime: burstTime,
        priority: priority,
        status: 'Pending',
        originalIndex: state.transactions.length,
        startTime: null,
        completionTime: null,
        turnaroundTime: null,
        waitingTime: null
    };

    state.transactions.push(newTx);
    appendLog(`Added transaction ${newTx.id}: ${newTx.customer} (${newTx.type}, P${newTx.priority}, AT:${newTx.arrivalTime}, BT:${newTx.burstTime}).`, 'arrive');
    
    closeAddTransactionModal();
    resetSimulationState();
    showToast(`Transaction ${newTx.id} added to ready queue!`, 'success');
}

function showFieldError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = message;
}

function clearFieldErrors() {
    ['errCustomerName', 'errArrivalTime', 'errBurstTime', 'errPriority'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
}

/**
 * Exports results table data as a downloadable CSV
 */
function exportResultsCSV() {
    if (!state.results || state.results.length === 0) {
        showToast('Run scheduling first before exporting results.', 'error');
        return;
    }

    let csv = 'Order,Transaction ID,Customer Name,Transaction Type,Priority,Arrival Time,Burst Time,Start Time,Completion Time,Turnaround Time,Waiting Time\n';
    state.results.forEach(r => {
        csv += `"${r.order}","${r.id}","${r.customer}","${r.type}","${r.priority}","${r.arrivalTime}","${r.burstTime}","${r.startTime}","${r.completionTime}","${r.turnaroundTime}","${r.waitingTime}"\n`;
    });
    csv += `\n"Average Turnaround Time","${state.summary.avgTAT}"\n`;
    csv += `"Average Waiting Time","${state.summary.avgWT}"\n`;
    csv += `"Total Execution Time","${state.summary.totalTime}"\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ATM_Priority_Scheduling_Results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Scheduling results exported as CSV!', 'success');
}

/**
 * Toast Notification system
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = {
        success: 'fa-circle-check text-emerald',
        error: 'fa-triangle-exclamation text-danger',
        info: 'fa-circle-info text-cyan'
    };

    toast.innerHTML = `
        <i class="fa-solid ${icons[type] || 'fa-bell'}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// =============================================================================
// 9. Event Listeners & Application Initialization
// =============================================================================

function setupEventListeners() {
    // Toolbar simulation control buttons
    DOM.runSimulationBtn.addEventListener('click', startSimulation);
    DOM.instantScheduleBtn.addEventListener('click', instantSchedule);
    DOM.stepSimBtn.addEventListener('click', stepSimulation);
    DOM.pauseResumeBtn.addEventListener('click', togglePauseSimulation);
    DOM.resetSimBtn.addEventListener('click', resetSimulationState);
    DOM.loadSampleBtn.addEventListener('click', loadSampleDataset);
    DOM.clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to remove all transactions from the queue?')) {
            clearAllTransactions();
        }
    });

    // Speed buttons
    DOM.speedButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.speedButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const speedMs = parseInt(btn.getAttribute('data-speed'), 10);
            state.simulation.stepIntervalMs = speedMs;

            // If running, restart interval with new speed
            if (state.simulation.status === 'RUNNING') {
                stopSimulationTimer();
                state.simulation.timerId = setInterval(() => {
                    executeSimulationCycle();
                }, state.simulation.stepIntervalMs);
            }
        });
    });

    // Modal triggers
    DOM.quickAddBtn.addEventListener('click', openAddTransactionModal);
    DOM.openAddModalBtn.addEventListener('click', openAddTransactionModal);
    DOM.modalCloseBtn.addEventListener('click', closeAddTransactionModal);
    DOM.modalCancelBtn.addEventListener('click', closeAddTransactionModal);
    DOM.addTxForm.addEventListener('submit', handleAddTransactionSubmit);

    // Auto-update presets on transaction type change in modal
    DOM.inputTxType.addEventListener('change', (e) => {
        applyTypePreset(e.target.value);
    });

    // Close modal on backdrop click
    DOM.addTxModal.addEventListener('click', (e) => {
        if (e.target === DOM.addTxModal) {
            closeAddTransactionModal();
        }
    });

    // Export & Log
    DOM.exportResultsBtn.addEventListener('click', exportResultsCSV);
    DOM.clearLogBtn.addEventListener('click', () => {
        DOM.logTerminalWindow.innerHTML = '<div class="log-line info">[System] Log cleared.</div>';
    });

    // Filters & Search
    DOM.txSearchInput.addEventListener('input', (e) => {
        state.filters.search = e.target.value.toLowerCase().trim();
        renderTransactionTable();
    });

    DOM.filterTypeSelect.addEventListener('change', (e) => {
        state.filters.type = e.target.value;
        renderTransactionTable();
    });

    DOM.filterPrioritySelect.addEventListener('change', (e) => {
        state.filters.priority = e.target.value;
        renderTransactionTable();
    });

    DOM.filterStatusSelect.addEventListener('change', (e) => {
        state.filters.status = e.target.value;
        renderTransactionTable();
    });

    // Responsive Mobile Sidebar Toggle
    DOM.sidebarToggleBtn.addEventListener('click', () => {
        DOM.sidebar.classList.toggle('open');
    });

    DOM.sidebarCloseBtn.addEventListener('click', () => {
        DOM.sidebar.classList.remove('open');
    });

    // Sidebar navigation active state tracking
    DOM.navItems.forEach(item => {
        item.addEventListener('click', () => {
            DOM.navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            if (window.innerWidth <= 900) {
                DOM.sidebar.classList.remove('open');
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAddTransactionModal();
        }
    });
}

// Initialize Application on Window Load
window.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadSampleDataset();
});
