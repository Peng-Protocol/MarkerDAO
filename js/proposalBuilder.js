// ./js/proposalBuilder.js

async function submitProposal() {
    const alpineData = Alpine.store('app');
    const proposal = {
        target: alpineData.proposal.target || '0x0000000000000000000000000000000000000000',
        callData: alpineData.proposal.callData || '0x',
        value: alpineData.proposal.value || '0',
        detail: alpineData.proposal.detail || '',
        type: alpineData.proposal.type || 'regular',
        interval: alpineData.proposal.interval || '0',
        runway: alpineData.proposal.runway || '0'
    };

    if (!window.web3Logic.walletAddress) {
        console.error('Wallet not connected');
        showError('Please connect your wallet first.');
        return;
    }

    try {
        let txHash;
        if (proposal.type === 'regular') {
            txHash = await window.web3Logic.propose(
                proposal.target,
                proposal.callData,
                BigInt(proposal.value),
                proposal.detail
            );
        } else if (proposal.type === 'routine') {
            txHash = await window.web3Logic.proposeRoutine(
                proposal.target,
                proposal.callData,
                BigInt(proposal.value),
                proposal.detail,
                BigInt(proposal.interval),
                BigInt(proposal.runway)
            );
        }

        if (txHash) {
            console.log(`Proposal submitted with tx: ${txHash}`);
            await checkTxStatus(txHash);
            await fetchProposals(); // Refresh proposals
            await fetchRoutines(); // Refresh routines if applicable

            // Reset form
            alpineData.proposal = {
                target: '',
                callData: '',
                value: '',
                detail: '',
                type: 'regular',
                interval: '',
                runway: ''
            };
        }
    } catch (error) {
        console.error('Error submitting proposal:', error);
        showError('Error submitting proposal: ' + (window.web3Logic.error || error.message));
    }
}

// Reuse checkTxStatus from proposals.js/routines.js (assumed global or duplicated here if needed)
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

document.addEventListener('alpine:init', () => {
    Alpine.store('app', {
        proposal: {
            target: '',
            callData: '',
            value: '',
            detail: '',
            type: 'regular',
            interval: '',
            runway: ''
        }
    });
});