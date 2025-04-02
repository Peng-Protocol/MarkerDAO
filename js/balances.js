// ./js/balances.js

async function fetchBalancesImpl() {
    if (!window.web3Logic.walletAddress) {
        console.error('Wallet not connected');
        alert('Wallet not connected');
        return;
    }

    try {
        console.log('Fetching balances for:', window.web3Logic.walletAddress);
        const pengBalance = await window.web3Logic.fetchBalance(
            window.web3Logic.PENG_NFT_ADDRESS,
            window.web3Logic.walletAddress
        );
        if (window.web3Logic.error) throw new Error(window.web3Logic.error);
        console.log('Peng balance fetched:', pengBalance.toString());

        const lusdBalance = await window.web3Logic.fetchBalance(
            window.web3Logic.LUSD_ADDRESS,
            window.web3Logic.walletAddress
        );
        if (window.web3Logic.error) throw new Error(window.web3Logic.error);
        console.log('LUSD balance fetched:', lusdBalance.toString());

        // Update Alpine.js data
        const alpineData = Alpine.store('app');
        if (!alpineData) {
            console.error('Alpine store not initialized');
            alert('Application state not initialized');
            return;
        }
        alpineData.pengBalance = Number(pengBalance.toString());
        alpineData.lusdBalance = Number(lusdBalance.toString()) / 10**18; // Convert from wei to LUSD
        console.log('Balances updated in Alpine store:', { pengBalance: alpineData.pengBalance, lusdBalance: alpineData.lusdBalance });

    } catch (error) {
        console.error('Error fetching balances:', error);
        alert('Error fetching balances: ' + (window.web3Logic.error || error.message));
    }
}

// Expose globally for manual or delayed trigger
window.fetchBalancesImpl = fetchBalancesImpl;