#!/bin/bash

# simple script that uses cast call with type extraction,
# reading the contract address from the deployment.json file
# generated post contract deployment

# Get the contract address from deployment.json
CONTRACT_ADDRESS=$(docker exec -it blockchain bash -c \
  "cat /blockchain/deployment/deployment.json | jq -r '.address'" 2>/dev/null | tr -d '\r')

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "ERROR: Could not read contract address from deployment.json"
  exit 1
fi

OUTPUT=$(docker exec -it blockchain bash -c \
  "cast call $CONTRACT_ADDRESS \
  'getTournament(uint256)((uint256,uint256,string,uint8,uint8,uint8))' $1 \
  --rpc-url http://localhost:8545" 2>/dev/null)

# Remove carriage returns and clean up the output
OUTPUT=$(echo "$OUTPUT" | tr -d '\r')

# Parse the tuple format: (id, timestamp, "username", playerCount, rounds, matches)
echo "$OUTPUT" | sed 's/[()]//g' | awk -F', ' '
{
  print "Tournament ID: " $1
  print "Timestamp: " $2
  # Extract username (remove quotes)
  gsub(/"/, "", $3)
  print "Winner Username: " $3
  print "Player Count: " $4
  print "Total Rounds: " $5
  print "Total Matches: " $6
}'