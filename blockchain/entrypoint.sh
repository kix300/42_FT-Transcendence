#!/bin/bash
set -e

echo "====================================="
echo "Starting blockchain service..."
echo "====================================="

echo "Starting Anvil from Avalanche blockchain..."
anvil --host 0.0.0.0 --chain-id 43114 --fork-url https://api.avax.network/ext/bc/C/rpc > /dev/null 2>&1 &
# avalanche chain id : 43114
# anvil --host 0.0.0.0 --chain-id 43114  > /dev/null 2>&1 &

ANVIL_PID=$!

# Wait for Anvil to be ready
echo "Waiting for Anvil to start..."
sleep 3

# Check if Anvil is running
if ! kill -0 $ANVIL_PID 2>/dev/null; then
    echo "ERROR: Anvil failed to start"
    exit 1
fi

echo "Anvil started successfully (PID: $ANVIL_PID)"

# Build the contract
echo "Building contract..."
forge build

# Deploy the contract
echo "Deploying TournamentRegistry contract..."
DEPLOY_OUTPUT=$(forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 2>&1)

# Extract contract address from deployment
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "TournamentRegistry deployed at:" | awk '{print $4}')

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "ERROR: Failed to extract contract address"
    echo "$DEPLOY_OUTPUT"
    kill $ANVIL_PID
    exit 1
fi

echo "Contract deployed at: $CONTRACT_ADDRESS"

# Extract ABI from compiled artifacts
echo "Extracting contract ABI from build artifacts..."
ABI=$(cat out/TournamentRegistry.sol/TournamentRegistry.json | jq -c '.abi')

# Create deployment.json with address and ABI
echo "Creating deployment.json..."
mkdir -p /blockchain/deployment
cat > /blockchain/deployment/deployment.json <<EOF
{
  "address": "$CONTRACT_ADDRESS",
  "chainId": 43114,
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "abi": $ABI
}
EOF

echo "Deployment info saved to /blockchain/deployment/deployment.json"

echo "====================================="
echo "Blockchain ready!"
echo "Contract Address: $CONTRACT_ADDRESS"
echo "RPC Endpoint: http://localhost:8545"
echo "====================================="

# Keep Anvil running in foreground
wait $ANVIL_PID
