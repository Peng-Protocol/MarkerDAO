// ./js/app.js
// Version: v0.2.5

// Dark Mode Logic
function initializeMode() {
    const savedMode = localStorage.getItem('isDarkMode');
    const isDarkMode = savedMode === null ? window.matchMedia('(prefers-color-scheme: dark)').matches : savedMode === 'true';
    applyMode(isDarkMode);
}

function toggleDarkMode() {
    const currentMode = document.body.classList.contains('dark-mode');
    applyMode(!currentMode);
}

function applyMode(isDarkMode) {
    document.body.classList.toggle('dark-mode', isDarkMode);
    const button = document.getElementById('modeToggle');
    if (button) button.textContent = isDarkMode ? '🌞' : '🌙';
    localStorage.setItem('isDarkMode', isDarkMode);
}

// Core App Logic
window.web3Logic = window.web3Logic || {
    walletAddress: null,
    chainId: null,
    error: null,
    connectWallet: async () => ({ address: null, chainId: null, rpcUrl: null }),
    fetchBalance: async () => 0n,
    voteProposal: async () => null,
    finalizeProposals: async () => null,
    pushRoutine: async () => null,
    propose: async () => null,
    proposeRoutine: async () => null,
    queryProposals: async () => ({}),
    queryRoutines: async () => ({}),
    fetchAllowance: async () => 0n,
    approveFFT: async () => null
};

let debounceTimeout = null;
function debounce(func, delay) {
    return function (...args) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => func(...args), delay);
    };
}

async function connectToWallet() {
    const connectButton = document.getElementById('connectWallet');
    connectButton.disabled = true;
    connectButton.textContent = 'Connecting...';
    try {
        if (!window.ethereum) {
            alert('No Ethereum provider detected. Please install a wallet like MetaMask.');
            return;
        }
        const walletData = await window.web3Logic.connectWallet();
        if (walletData.address) {
            connectButton.textContent = `${walletData.address.slice(0, 6)}...${walletData.address.slice(-4)}`;
            connectButton.classList.add('connected');
            document.getElementById('walletModal').classList.remove('show');
            updateNetworkButton(walletData.chainId);
            console.log('Wallet connected successfully:', walletData);
            // Delay fetches until UI stabilizes (manual trigger elsewhere if needed)
        } else if (window.web3Logic.error) {
            alert(window.web3Logic.error);
        } else {
            alert('Wallet connection failed. No address returned.');
        }
    } catch (err) {
        console.error('Connect wallet failed:', err);
        alert(`Failed to connect wallet: ${err.message}`);
    } finally {
        connectButton.disabled = false;
        if (!window.web3Logic.walletAddress) connectButton.textContent = 'Connect Wallet';
    }
}

function updateNetworkButton(chainId) {
    const networkButton = document.getElementById('networkSettings');
    if (chainId === '0x89') {
        networkButton.innerHTML = '<img src="./assets/matic-logo-1.webp" alt="Polygon" style="width: 24px; height: 24px;">';
    } else {
        networkButton.textContent = '🌐';
    }
}

async function handleNetworkSwitch() {
    if (!window.web3Logic.walletAddress) {
        alert('Please connect wallet to switch network.');
        return;
    }
    if (!window.ethereum) {
        alert('No Ethereum provider detected. Please install a wallet like MetaMask.');
        return;
    }
    if (window.web3Logic.chainId !== '0x89') {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x89' }]
            });
            updateNetworkButton('0x89');
            console.log('Switched to Polygon network (0x89)');
        } catch (switchErr) {
            if (switchErr.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x89',
                            chainName: 'Polygon POS',
                            rpcUrls: ['https://polygon-rpc.com'],
                            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                            blockExplorerUrls: ['https://polygonscan.com']
                        }]
                    });
                    updateNetworkButton('0x89');
                    console.log('Added Polygon network (0x89)');
                } catch (addErr) {
                    console.error('Failed to add Polygon network:', addErr);
                    alert(`Failed to add Polygon network: ${addErr.message}`);
                }
            } else {
                console.error('Network switch failed:', switchErr);
                alert(`Network switch failed: ${switchErr.message}`);
            }
        }
    } else {
        console.log('Already on Polygon network (0x89), no switch needed');
    }
}

function generateQRCode() {
    document.getElementById('qrError').style.display = 'none';
    const inputAddress = document.getElementById('qrAddress').value.trim();
    let uri;
    if (inputAddress) {
        if (/^0x[a-fA-F0-9]{40}$/.test(inputAddress)) {
            uri = `ethereum:${inputAddress}@137`;
        } else {
            showQRError('Invalid Ethereum address.');
            return;
        }
    } else if (window.web3Logic.walletAddress) {
        uri = `ethereum:${window.web3Logic.walletAddress}@137`;
    } else {
        uri = 'https://link.dexhune.eth.limo';
    }
    const canvas = document.getElementById('qrCanvas');
    QRCode.toCanvas(canvas, uri, { width: 300 }, (err) => {
        if (err) {
            console.error('QR Code failed:', err);
            showQRError('QR Code generation failed.');
        } else {
            document.getElementById('copyUri').style.display = 'block';
        }
    });
}

function showQRError(message) {
    const errorSpan = document.getElementById('qrError');
    errorSpan.textContent = message;
    errorSpan.style.display = 'block';
}

function copyURI() {
    const inputAddress = document.getElementById('qrAddress').value.trim();
    let uri;
    if (inputAddress) {
        if (/^0x[a-fA-F0-9]{40}$/.test(inputAddress)) {
            uri = `ethereum:${inputAddress}@137`;
        } else {
            uri = 'https://link.dexhune.eth.limo';
        }
    } else if (window.web3Logic.walletAddress) {
        uri = `ethereum:${window.web3Logic.walletAddress}@137`;
    } else {
        uri = 'https://dao.dexhune.eth.limo';
    }
    navigator.clipboard.writeText(uri).then(() => {
        alert('URI copied: ' + uri);
    }).catch(err => {
        console.error('Copy URI failed:', err);
        alert('Copy failed: ' + err.message);
    });
}

function disconnectWallet() {
    window.web3Logic.walletAddress = null;
    window.web3Logic.chainId = null;
    window.web3Logic.error = null;
    document.getElementById('connectWallet').textContent = 'Connect Wallet';
    document.getElementById('connectWallet').classList.remove('connected');
    document.getElementById('networkSettings').textContent = '🌐';
    document.getElementById('disconnectModal').classList.remove('show');
    // Reset Alpine data
    Alpine.store('app', { 
        walletConnected: false, 
        pengBalance: 0, 
        lusdBalance: 0, 
        proposals: [], 
        routineProposals: [], 
        routines: [], 
        passedProposals: [], 
        rejectedProposals: [],
        errorMessage: ''
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeMode();
    // Alpine initialization
    document.addEventListener('alpine:init', () => {
        Alpine.store('app', {
            walletConnected: false,
            pengBalance: 0,
            lusdBalance: 0,
            proposals: [],
            routineProposals: [],
            routines: [],
            passedProposals: [],
            rejectedProposals: [],
            errorMessage: ''
        });
    });

    window.addEventListener('chainChanged', () => updateNetworkButton(window.web3Logic.chainId));
    // Debounced update triggers (kept but not called immediately)
    window.fetchBalances = debounce(() => window.fetchBalancesImpl(), 500);
    window.fetchProposals = debounce(() => window.fetchProposalsImpl(), 500);
    window.fetchRoutineProposals = debounce(() => window.fetchRoutineProposalsImpl(), 500);
    window.fetchRoutines = debounce(() => window.fetchRoutinesImpl(), 500);

    // Button click handlers
    const connectButton = document.getElementById('connectWallet');
    const networkButton = document.getElementById('networkSettings');
    connectButton.addEventListener('click', () => {
        if (connectButton.classList.contains('connected')) {
            document.getElementById('disconnectModal').classList.add('show');
        } else {
            document.getElementById('walletModal').classList.add('show');
        }
    });
    networkButton.addEventListener('click', handleNetworkSwitch);
});