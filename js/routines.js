// ./js/routines.js

async function fetchRoutines() {
    if (!window.web3Logic.walletAddress) {
        console.error('Wallet not connected');
        return;
    }

    try {
        const routines = [];
        let i = 0n;
        while (true) {
            const routine = await window.web3Logic.queryRoutines(i);
            if (Object.keys(routine).length === 0 || !routine.active) break; // Stop if empty or inactive
            routines.push(routine);
            i++;
        }

        // Update Alpine.js data
        const alpineData = Alpine.store('app');
        alpineData.routines = routines.reverse();

    } catch (error) {
        console.error('Error fetching routines:', error);
        showError('Error fetching routines: ' + (window.web3Logic.error || error.message));
    }
}

async function executeRoutine(routineIndex) {
    try {
        const txHash = await window.web3Logic.pushRoutine(routineIndex);
        if (txHash) {
            console.log(`Executing routine ${routineIndex} with tx: ${txHash}`);
            await checkTxStatus(txHash);
            await fetchRoutines(); // Refresh routines
        }
    } catch (error) {
        console.error('Error executing routine:', error);
        showError('Error executing routine: ' + (window.web3Logic.error || error.message));
    }
}

// Reuse checkTxStatus from proposals.js (assumed global or duplicated here if needed)
async function checkTxStatus(txHash) {
    let status = null;
    while (status === null) {
        status = await window.web3Logic.checkTransactionReceipt(txHash);
        if (status === null) await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2s
    }
    if (!status) {
        throw new Error('Transaction failed');
    }
}