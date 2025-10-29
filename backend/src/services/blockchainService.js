import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';

/**
 * BlockchainService - Handles interaction with the TournamentRegistry smart contract
 */
class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.wallet = null;
    this.initialized = false;
  }

  /**
   * Initialize the blockchain service with provider and contract
   */
  async initialize() {
    try {
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://blockchain:8545';
      const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

      console.log('Initializing blockchain service...');
      console.log('RPC URL:', rpcUrl);

      // Create provider and wallet
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // Load deployment info
      const deploymentPath = '/blockchain/deployment/deployment.json';
      const deploymentData = await fs.readFile(deploymentPath, 'utf-8');
      const deployment = JSON.parse(deploymentData);

      console.log('Contract address:', deployment.address);

      // Create contract instance
      this.contract = new ethers.Contract(
        deployment.address,
        deployment.abi,
        this.wallet
      );

      // Test connection
      const blockNumber = await this.provider.getBlockNumber();
      console.log('Connected to blockchain at block:', blockNumber);

      this.initialized = true;
      console.log('Blockchain service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }


  /**
   * Record a tournament result on the blockchain
   * @param {Object} tournamentData - Tournament data
   * @param {string} tournamentData.winnerUsername - Winner's username
   * @param {number} tournamentData.playerCount - Number of players in tournament
   * @param {number} tournamentData.totalRounds - Total rounds played
   * @param {number} tournamentData.totalMatches - Total matches played
   * @returns {Promise<Object>} Transaction result with tournament ID
   */
  async recordTournament({ winnerUsername, playerCount, totalRounds, totalMatches }) {
    if (!this.initialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      console.log('Recording tournament on blockchain:', {
        winnerUsername,
        playerCount,
        totalRounds,
        totalMatches
      });

      // Call smart contract
      const tx = await this.contract.recordTournament(
        winnerUsername,
        playerCount,
        totalRounds,
        totalMatches
      );

      console.log('Transaction sent:', tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction mined in block:', receipt.blockNumber);

      // Extract tournament ID from event logs
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed && parsed.name === 'TournamentRecorded';
        } catch {
          return false;
        }
      });

      let tournamentId = null;
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        tournamentId = parsed.args.tournamentId.toString();
      }

      return {
        success: true,
        tournamentId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error recording tournament on blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get tournament data from the blockchain
   * @param {number} tournamentId - Tournament ID
   * @returns {Promise<Object>} Tournament data
   */
  async getTournament(tournamentId) {
    if (!this.initialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const tournament = await this.contract.getTournament(tournamentId);

      return {
        id: tournament.id.toString(),
        timestamp: new Date(Number(tournament.timestamp) * 1000), // since date stores it in ms
        winnerUsername: tournament.winnerUsername,
        playerCount: tournament.playerCount,
        totalRounds: tournament.totalRounds,
        totalMatches: tournament.totalMatches
      };
    } catch (error) {
      console.error('Error fetching tournament from blockchain:', error);
      throw error;
    }
  }

  /**
   * Get the total number of tournaments recorded
   * @returns {Promise<number>} Tournament count
   */
  async getTournamentCount() {
    if (!this.initialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const count = await this.contract.tournamentCount();
      return Number(count);
    } catch (error) {
      console.error('Error fetching tournament count:', error);
      throw error;
    }
  }

  /**
   * Check if the service is initialized and ready
   * @returns {boolean}
   */
  isReady() {
    return this.initialized;
  }
}

// Export singleton instance
export default new BlockchainService();
