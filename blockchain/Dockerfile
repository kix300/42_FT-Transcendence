FROM ghcr.io/foundry-rs/foundry:stable

# Switch to root to install packages
USER root

# Install jq for JSON processing
RUN apt-get update && apt-get install -y jq && rm -rf /var/lib/apt/lists/*

# Switch back to foundry user
USER foundry

WORKDIR /blockchain

# Copy blockchain project files
COPY foundry.toml ./
COPY contracts/ ./contracts/
COPY script/ ./script/

# Install forge-std library
RUN forge install foundry-rs/forge-std --no-git

# Create directory for deployment info
RUN mkdir -p /blockchain/deployment

# Copy entrypoint script with execute permissions
COPY --chmod=755 entrypoint.sh /blockchain/entrypoint.sh

# Expose Anvil RPC port
EXPOSE 8545

# Set entrypoint
ENTRYPOINT ["/blockchain/entrypoint.sh"]
