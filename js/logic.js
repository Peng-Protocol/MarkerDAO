// ./js/logic.js
// Version: v0.2.2

const web3Logic = {
    walletAddress: null,
    chainId: null,
    error: null,
    rpcUrl: null,

    // Contract Addresses
    PENG_NFT_ADDRESS: "0xB1a58fae5C0E952F64f9433789a350b8ab54D6D0",
    LUSD_ADDRESS: "0xF0FD398Ca09444F771eC968d9cbF073a744A544c",
    MARKER_DAO_ADDRESS: "0x06cfD34CE8a1F0756b72fE6116670D08DE7A4203",

    // RPC Endpoints for Polygon PoS with redundancy
    rpcEndpoints: [
        "https://polygon-rpc.com",
        "https://rpc-mainnet.maticvigil.com",
        "https://rpc-mainnet.matic.quiknode.pro"
    ],
    currentRpcIndex: 0,

    // Contract ABIs
    PENG_NFT_ABI: [
        { inputs: [{ internalType: "address", name: "owner", type: "address" }], name: "balanceOf", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }
    ],
    LUSD_ABI: [
        { inputs: [{ internalType: "address", name: "", type: "address" }, { internalType: "address", name: "", type: "address" }], name: "allowance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
        { inputs: [{ internalType: "address", name: "spender", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "approve", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" }
    ],
    MARKER_DAO_ABI: [
        { inputs: [], name: "proposalCount", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
        { inputs: [{ internalType: "uint256", name: "index", type: "uint256" }], name: "queryProposals", outputs: [{ components: [{ internalType: "uint256", name: "index", type: "uint256" }, { internalType: "string", name: "detail", type: "string" }, { internalType: "address", name: "target", type: "address" }, { internalType: "bytes", name: "callData", type: "bytes" }, { internalType: "uint256", name: "value", type: "uint256" }, { internalType: "enum MarkerDAO.ProposalType", name: "proposalType", type: "uint8" }, { internalType: "enum MarkerDAO.ProposalStatus", name: "status", type: "uint8" }, { internalType: "uint256", name: "votesFor", type: "uint256" }, { internalType: "uint256", name: "votesAgainst", type: "uint256" }, { internalType: "uint256", name: "turnout", type: "uint256" }, { internalType: "uint256", name: "deadline", type: "uint256" }, { internalType: "uint256", name: "finalizeTimeRemaining", type: "uint256" }], internalType: "struct MarkerDAO.ProposalData", name: "", type: "tuple" }], stateMutability: "view", type: "function" },
        { inputs: [{ internalType: "uint256", name: "routineIndex", type: "uint256" }], name: "queryRoutines", outputs: [{ components: [{ internalType: "uint256", name: "index", type: "uint256" }, { internalType: "string", name: "detail", type: "string" }, { internalType: "address", name: "target", type: "address" }, { internalType: "bytes", name: "callData", type: "bytes" }, { internalType: "uint256", name: "value", type: "uint256" }, { internalType: "address", name: "proposer", type: "address" }, { internalType: "uint256", name: "interval", type: "uint256" }, { internalType: "uint256", name: "runwayEnd", type: "uint256" }, { internalType: "uint256", name: "lastExecution", type: "uint256" }, { internalType: "bool", name: "active", type: "bool" }, { internalType: "uint256", name: "proposalIndex", type: "uint256" }, { internalType: "uint256", name: "intervalTimeRemaining", type: "uint256" }], internalType: "struct MarkerDAO.RoutineData", name: "", type: "tuple" }], stateMutability: "view", type: "function" },
        { inputs: [{ internalType: "bool", name: "isUpvote", type: "bool" }, { internalType: "uint256", name: "proposalId", type: "uint256" }, { internalType: "uint8", name: "proposalType", type: "uint8" }, { internalType: "uint256", name: "fftAmount", type: "uint256" }], name: "voteProposal", outputs: [], stateMutability: "nonpayable", type: "function" },
        { inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }, { internalType: "uint8", name: "proposalType", type: "uint8" }], name: "finalizeProposals", outputs: [], stateMutability: "nonpayable", type: "function" },
        { inputs: [{ internalType: "uint256", name: "routineIndex", type: "uint256" }], name: "pushRoutine", outputs: [], stateMutability: "nonpayable", type: "function" },
        { inputs: [{ internalType: "address", name: "target", type: "address" }, { internalType: "bytes", name: "callData", type: "bytes" }, { internalType: "uint256", name: "value", type: "uint256" }, { internalType: "string", name: "detail", type: "string" }], name: "propose", outputs: [], stateMutability: "nonpayable", type: "function" },
        { inputs: [{ internalType: "address", name: "target", type: "address" }, { internalType: "bytes", name: "callData", type: "bytes" }, { internalType: "uint256", name: "value", type: "uint256" }, { internalType: "string", name: "detail", type: "string" }, { internalType: "uint256", name: "interval", type: "uint256" }, { internalType: "uint256", name: "runwayDuration", type: "uint256" }], name: "proposeRoutine", outputs: [], stateMutability: "nonpayable", type: "function" }
    ],

    // ABI Decoder Instance
    abiDecoder: window.ethereumjs && window.ethereumjs.ABI ? new window.ethereumjs.ABI() : null,

    async connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.walletAddress = accounts[0];
                this.chainId = await window.ethereum.request({ method: 'eth_chainId' });
                this.rpcUrl = this.rpcEndpoints[this.currentRpcIndex];
                this.error = null;
                console.log('Wallet connected:', { address: this.walletAddress, chainId: this.chainId, rpcUrl: this.rpcUrl });
                window.ethereum.on('accountsChanged', (accounts) => { 
                    this.walletAddress = accounts[0] || null; 
                    console.log('Accounts changed:', this.walletAddress);
                });
                window.ethereum.on('chainChanged', (newChainId) => { 
                    this.chainId = newChainId; 
                    console.log('Chain changed:', newChainId);
                    window.dispatchEvent(new Event('chainChanged')); 
                });
            } catch (err) {
                this.error = 'Failed to connect wallet: ' + err.message;
                console.error('Wallet connection failed:', err);
            }
        } else {
            this.error = 'No Ethereum provider detected.';
            console.error('No Ethereum provider found.');
        }
        return { address: this.walletAddress, chainId: this.chainId, rpcUrl: this.rpcUrl };
    },

    async tryRpcCall(method, params) {
        for (let i = 0; i < this.rpcEndpoints.length; i++) {
            try {
                this.currentRpcIndex = (this.currentRpcIndex + i) % this.rpcEndpoints.length;
                this.rpcUrl = this.rpcEndpoints[this.currentRpcIndex];
                return await window.ethereum.request({ method, params });
            } catch (err) {
                console.error(`RPC ${this.rpcUrl} failed:`, err);
                if (i === this.rpcEndpoints.length - 1) {
                    this.error = `All RPCs failed: ${err.message}`;
                    throw err;
                }
            }
        }
    },

    encodeParameters(types, values) {
        let data = '';
        for (let i = 0; i < types.length; i++) {
            if (types[i] === 'address') {
                data += values[i].replace('0x', '').padStart(64, '0');
            } else if (types[i] === 'uint256' || types[i] === 'uint8') {
                const hex = BigInt(values[i]).toString(16);
                data += hex.padStart(64, '0');
            } else if (types[i] === 'bool') {
                data += (values[i] ? '1' : '0').padStart(64, '0');
            } else if (types[i] === 'bytes') {
                data += values[i].replace('0x', '').padEnd(64, '0');
            } else if (types[i] === 'string') {
                const hex = Array.from(values[i]).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
                data += hex.padEnd(64, '0');
            }
        }
        return data;
    },

    decodeUint256(hex) { return BigInt('0x' + (hex.replace('0x', '') || '0')); },

    decodeProposalData(hex) {
        if (!this.abiDecoder) {
            this.error = 'ABI decoder not available.';
            return {};
        }
        try {
            const types = [
                'uint256', 'string', 'address', 'bytes', 'uint256', 'uint8', 'uint8',
                'uint256', 'uint256', 'uint256', 'uint256', 'uint256'
            ];
            const decoded = this.abiDecoder.rawDecode(types, Buffer.from(hex.replace('0x', ''), 'hex'));
            return {
                index: BigInt(decoded[0]),
                detail: decoded[1],
                target: '0x' + decoded[2].toString('hex'),
                callData: '0x' + decoded[3].toString('hex'),
                value: BigInt(decoded[4]),
                proposalType: Number(decoded[5]),
                status: Number(decoded[6]),
                votesFor: BigInt(decoded[7]),
                votesAgainst: BigInt(decoded[8]),
                turnout: BigInt(decoded[9]),
                deadline: BigInt(decoded[10]),
                finalizeTimeRemaining: BigInt(decoded[11])
            };
        } catch (err) {
            this.error = 'Failed to decode proposal data: ' + err.message;
            return {};
        }
    },

    decodeRoutineData(hex) {
        if (!this.abiDecoder) {
            this.error = 'ABI decoder not available.';
            return {};
        }
        try {
            const types = [
                'uint256', 'string', 'address', 'bytes', 'uint256', 'address',
                'uint256', 'uint256', 'uint256', 'bool', 'uint256', 'uint256'
            ];
            const decoded = this.abiDecoder.rawDecode(types, Buffer.from(hex.replace('0x', ''), 'hex'));
            return {
                index: BigInt(decoded[0]),
                detail: decoded[1],
                target: '0x' + decoded[2].toString('hex'),
                callData: '0x' + decoded[3].toString('hex'),
                value: BigInt(decoded[4]),
                proposer: '0x' + decoded[5].toString('hex'),
                interval: BigInt(decoded[6]),
                runwayEnd: BigInt(decoded[7]),
                lastExecution: BigInt(decoded[8]),
                active: decoded[9],
                proposalIndex: BigInt(decoded[10]),
                intervalTimeRemaining: BigInt(decoded[11])
            };
        } catch (err) {
            this.error = 'Failed to decode routine data: ' + err.message;
            return {};
        }
    },

    async fetchBalance(contractAddress, queryAddress) {
        if (!queryAddress) {
            this.error = 'No address provided to query.';
            return 0n;
        }
        try {
            const selector = '0x70a08231'; // balanceOf(address)
            const data = selector + this.encodeParameters(['address'], [queryAddress]);
            const result = await this.tryRpcCall('eth_call', [{ to: contractAddress, data }, 'latest']);
            this.error = null;
            return this.decodeUint256(result);
        } catch (err) {
            this.error = 'Failed to fetch balance: ' + err.message;
            return 0n;
        }
    },

    async fetchAllowance(owner, spender) {
        try {
            const selector = '0xdd62ed3e'; // allowance(address,address)
            const data = selector + this.encodeParameters(['address', 'address'], [owner, spender]);
            const result = await this.tryRpcCall('eth_call', [{ to: this.LUSD_ADDRESS, data }, 'latest']);
            this.error = null;
            return this.decodeUint256(result);
        } catch (err) {
            this.error = 'Failed to fetch allowance: ' + err.message;
            return 0n;
        }
    },

    async approveFFT(spender, amount) {
        if (!this.walletAddress) {
            this.error = 'Please connect your wallet first.';
            return null;
        }
        try {
            const selector = '0x095ea7b3'; // approve(address,uint256)
            const data = selector + this.encodeParameters(['address', 'uint256'], [spender, amount * BigInt(10**18)]);
            const txHash = await this.tryRpcCall('eth_sendTransaction', [{
                from: this.walletAddress,
                to: this.LUSD_ADDRESS,
                data: data
            }]);
            this.error = null;
            return txHash;
        } catch (err) {
            this.error = 'Failed to approve LUSD: ' + err.message;
            return null;
        }
    },

    async voteProposal(isUpvote, proposalId, proposalType, fftAmount) {
        if (!this.walletAddress) {
            this.error = 'Please connect your wallet first.';
            return null;
        }
        try {
            const selector = '0x410e1518'; // voteProposal(bool,uint256,uint8,uint256)
            const data = selector + this.encodeParameters(['bool', 'uint256', 'uint8', 'uint256'], [isUpvote, proposalId, proposalType, fftAmount * BigInt(10**18)]);
            const txHash = await this.tryRpcCall('eth_sendTransaction', [{
                from: this.walletAddress,
                to: this.MARKER_DAO_ADDRESS,
                data: data
            }]);
            this.error = null;
            return txHash;
        } catch (err) {
            this.error = 'Failed to vote: ' + err.message;
            return null;
        }
    },

    async finalizeProposals(proposalId, proposalType) {
        if (!this.walletAddress) {
            this.error = 'Please connect your wallet first.';
            return null;
        }
        try {
            const selector = '0x7aab8c0a'; // finalizeProposals(uint256,uint8)
            const data = selector + this.encodeParameters(['uint256', 'uint8'], [proposalId, proposalType]);
            const txHash = await this.tryRpcCall('eth_sendTransaction', [{
                from: this.walletAddress,
                to: this.MARKER_DAO_ADDRESS,
                data: data
            }]);
            this.error = null;
            return txHash;
        } catch (err) {
            this.error = 'Failed to finalize: ' + err.message;
            return null;
        }
    },

    async pushRoutine(routineIndex) {
        if (!this.walletAddress) {
            this.error = 'Please connect your wallet first.';
            return null;
        }
        try {
            const selector = '0xc6d59da2'; // pushRoutine(uint256)
            const data = selector + this.encodeParameters(['uint256'], [routineIndex]);
            const txHash = await this.tryRpcCall('eth_sendTransaction', [{
                from: this.walletAddress,
                to: this.MARKER_DAO_ADDRESS,
                data: data
            }]);
            this.error = null;
            return txHash;
        } catch (err) {
            this.error = 'Failed to push routine: ' + err.message;
            return null;
        }
    },

    async propose(target, callData, value, detail) {
        if (!this.walletAddress) {
            this.error = 'Please connect your wallet first.';
            return null;
        }
        try {
            const selector = '0xdf8b53ed'; // propose(address,bytes,uint256,string)
            const data = selector + this.encodeParameters(['address', 'bytes', 'uint256', 'string'], [target, callData, value, detail]);
            const txHash = await this.tryRpcCall('eth_sendTransaction', [{
                from: this.walletAddress,
                to: this.MARKER_DAO_ADDRESS,
                data: data
            }]);
            this.error = null;
            return txHash;
        } catch (err) {
            this.error = 'Failed to propose: ' + err.message;
            return null;
        }
    },

    async proposeRoutine(target, callData, value, detail, interval, runwayDuration) {
        if (!this.walletAddress) {
            this.error = 'Please connect your wallet first.';
            return null;
        }
        try {
            const selector = '0xb033ac08'; // proposeRoutine(address,bytes,uint256,string,uint256,uint256)
            const data = selector + this.encodeParameters(['address', 'bytes', 'uint256', 'string', 'uint256', 'uint256'], [target, callData, value, detail, interval, runwayDuration]);
            const txHash = await this.tryRpcCall('eth_sendTransaction', [{
                from: this.walletAddress,
                to: this.MARKER_DAO_ADDRESS,
                data: data
            }]);
            this.error = null;
            return txHash;
        } catch (err) {
            this.error = 'Failed to propose routine: ' + err.message;
            return null;
        }
    },

    async queryProposals(index) {
        try {
            const selector = '0x0f6c9c90'; // queryProposals(uint256)
            const data = selector + this.encodeParameters(['uint256'], [index]);
            const result = await this.tryRpcCall('eth_call', [{ to: this.MARKER_DAO_ADDRESS, data }, 'latest']);
            this.error = null;
            return this.decodeProposalData(result);
        } catch (err) {
            this.error = 'Failed to query proposal: ' + err.message;
            return {};
        }
    },

    async queryRoutines(routineIndex) {
        try {
            const selector = '0x6609235f'; // queryRoutines(uint256)
            const data = selector + this.encodeParameters(['uint256'], [routineIndex]);
            const result = await this.tryRpcCall('eth_call', [{ to: this.MARKER_DAO_ADDRESS, data }, 'latest']);
            this.error = null;
            return this.decodeRoutineData(result);
        } catch (err) {
            this.error = 'Failed to query routine: ' + err.message;
            return {};
        }
    },

    async checkTransactionReceipt(txHash) {
        try {
            const receipt = await this.tryRpcCall('eth_getTransactionReceipt', [txHash]);
            this.error = null;
            if (receipt === null) return null; // Pending
            return receipt.status === '0x1'; // true (success) or false (failed)
        } catch (err) {
            this.error = 'Failed to check transaction receipt: ' + err.message;
            throw err;
        }
    }
};

window.web3Logic = web3Logic;