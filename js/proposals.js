// ./js/proposals.js

async function fetchProposals() {
    if (!window.web3Logic.walletAddress) {
        console.error('Wallet not connected');
        return;
    }

    try {
        const proposalCountResult = await window.web3Logic.tryRpcCall('eth_call', [{
            to: window.web3Logic.MARKER_DAO_ADDRESS,
            data: '0x3e0375b8' // proposalCount()
        }, 'latest']);
        const proposalCount = window.web3Logic.decodeUint256(proposalCountResult);

        const proposals = [];
        const routineProposals = [];
        const passedProposals = [];
        const rejectedProposals = [];

        for (let i = 0n; i < proposalCount; i++) {
            const proposal = await window.web3Logic.queryProposals(i);
            if (Object.keys(proposal).length === 0) continue; // Skip if decoding failed

            if (proposal.proposalType === 0) { // Regular proposal
                if (proposal.status === 0) { // Pending
                    proposals.push(proposal);
                } else if (proposal.status === 1) { // Rejected
                    rejectedProposals.push(proposal);
                } else if (proposal.status === 2) { // Passed
                    passedProposals.push(proposal);
                }
            } else if (proposal.proposalType === 1) { // Routine proposal
                if (proposal.status === 0) { // Pending
                    routineProposals.push(proposal);
                }
            }
        }

        // Update Alpine.js data
        const alpineData = Alpine.store('app');
        alpineData.proposals = proposals.reverse();
        alpineData.routineProposals = routineProposals.reverse();
        alpineData.passedProposals = passedProposals.reverse();
        alpineData.rejectedProposals = rejectedProposals.reverse();

    } catch (error) {
        console.error('Error fetching proposals:', error);
        showError('Error fetching proposals: ' + (window.web3Logic.error || error.message));
    }
}

async function finalizeProposal(proposalIndex, proposalType) {
    try {
        const txHash = await window.web3Logic.finalizeProposals(proposalIndex, proposalType);
        if (txHash) {
            console.log(`Finalizing proposal ${proposalIndex} with tx: ${txHash}`);
            await checkTxStatus(txHash);
            await fetchProposals(); // Refresh proposals
        }
    } catch (error) {
        console.error('Error finalizing proposal:', error);
        showError('Error finalizing proposal: ' + (window.web3Logic.error || error.message));
    }
}

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