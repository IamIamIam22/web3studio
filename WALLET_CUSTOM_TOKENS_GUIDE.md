# Nexus Sentinel — Multi-Chain Custom Tokens & Wallet Import Guide

This guide contains all custom token contract addresses, decimal configurations, network RPC parameters, and step-by-step instructions for adding custom tokens and networks into **MetaMask**, **Rabby**, **Coinbase Wallet**, **Trust Wallet**, **Rainbow**, **Phantom**, and **Ledger Live**.

---

## 1. Quick Reference: Custom & Common Tokens by Network

### 🌐 Ethereum Mainnet (Chain ID: `1`)
| Token Name | Symbol | Contract Address | Decimals | Standard |
| :--- | :--- | :--- | :---: | :---: |
| **Nexus Yield Token** | `NYT` | `0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7` | 18 | ERC-20 |
| **USD Coin** | `USDC` | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 6 | ERC-20 |
| **Tether USD** | `USDT` | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | 6 | ERC-20 |
| **Wrapped Ether** | `WETH` | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | 18 | ERC-20 |
| **Dai Stablecoin** | `DAI` | `0x6B175474E89094C44Da98b954EedeAC495271d0F` | 18 | ERC-20 |
| **Wrapped BTC** | `WBTC` | `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599` | 8 | ERC-20 |
| **Chainlink** | `LINK` | `0x514910771AF9Ca656af840dff83E8264EcF986CA` | 18 | ERC-20 |
| **Uniswap** | `UNI` | `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984` | 18 | ERC-20 |

---

### 🔵 Arbitrum One (Chain ID: `42161`)
| Token Name | Symbol | Contract Address | Decimals | Standard |
| :--- | :--- | :--- | :---: | :---: |
| **USD Coin (Native)** | `USDC` | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | 6 | ERC-20 |
| **Tether USD** | `USDT` | `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9` | 6 | ERC-20 |
| **Wrapped Ether** | `WETH` | `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1` | 18 | ERC-20 |
| **Arbitrum Token** | `ARB` | `0x912CE59144191C1204E64559FE8253a0e49E6548` | 18 | ERC-20 |
| **GMX Token** | `GMX` | `0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a` | 18 | ERC-20 |

---

### 🔵 Base Mainnet (Chain ID: `8453`)
| Token Name | Symbol | Contract Address | Decimals | Standard |
| :--- | :--- | :--- | :---: | :---: |
| **USD Coin (Native)** | `USDC` | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6 | ERC-20 |
| **Wrapped Ether** | `WETH` | `0x4200000000000000000000000000000000000006` | 18 | ERC-20 |
| **Coinbase Wrapped BTC** | `cbBTC` | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` | 8 | ERC-20 |
| **Aerodrome Finance** | `AERO` | `0x940181a94A35A4569E4529A3CDfB74e38FD98631` | 18 | ERC-20 |

---

### 🔴 OP Mainnet / Optimism (Chain ID: `10`)
| Token Name | Symbol | Contract Address | Decimals | Standard |
| :--- | :--- | :--- | :---: | :---: |
| **USD Coin (Native)** | `USDC` | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` | 6 | ERC-20 |
| **Optimism** | `OP` | `0x4200000000000000000000000000000000000042` | 18 | ERC-20 |
| **Wrapped Ether** | `WETH` | `0x4200000000000000000000000000000000000006` | 18 | ERC-20 |

---

### 🟣 Polygon PoS (Chain ID: `137`)
| Token Name | Symbol | Contract Address | Decimals | Standard |
| :--- | :--- | :--- | :---: | :---: |
| **USD Coin (Native)** | `USDC` | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` | 6 | ERC-20 |
| **Tether USD** | `USDT` | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` | 6 | ERC-20 |
| **Wrapped Ether** | `WETH` | `0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619` | 18 | ERC-20 |
| **Polygon Ecosystem** | `POL` | `0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3e6` | 18 | ERC-20 |

---

### 🟡 BNB Smart Chain (Chain ID: `56`)
| Token Name | Symbol | Contract Address | Decimals | Standard |
| :--- | :--- | :--- | :---: | :---: |
| **Binance-Peg Tether USD** | `USDT` | `0x55d398326f99059fF775485246999027B3197955` | 18 | BEP-20 |
| **Binance-Peg USD Coin** | `USDC` | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` | 18 | BEP-20 |
| **Wrapped BNB** | `WBNB` | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` | 18 | BEP-20 |
| **PancakeSwap** | `CAKE` | `0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82` | 18 | BEP-20 |

---

### 🔺 Avalanche C-Chain (Chain ID: `43114`)
| Token Name | Symbol | Contract Address | Decimals | Standard |
| :--- | :--- | :--- | :---: | :---: |
| **USD Coin (Native)** | `USDC` | `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` | 6 | ERC-20 |
| **Tether USD** | `USDT` | `0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7` | 6 | ERC-20 |
| **Wrapped AVAX** | `WAVAX` | `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7` | 18 | ERC-20 |

---

### 🧪 Ethereum Sepolia Testnet (Chain ID: `11155111`)
| Token Name | Symbol | Contract Address | Decimals | Standard |
| :--- | :--- | :--- | :---: | :---: |
| **Sepolia Test USDC** | `USDC` | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | 6 | ERC-20 |
| **Sepolia Test WETH** | `WETH` | `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14` | 18 | ERC-20 |
| **Sepolia Chainlink** | `LINK` | `0x779877A7B0D9E8603169DdbD7836e478b4624789` | 18 | ERC-20 |

---

## 2. EVM Network RPC Settings (For Adding Custom Chains to Wallets)

If the network is not yet active in your wallet, add it with these parameters:

| Network Name | RPC URL | Chain ID (Dec / Hex) | Currency Symbol | Block Explorer URL |
| :--- | :--- | :--- | :--- | :--- |
| **Ethereum Mainnet** | `https://cloudflare-eth.com` | `1` (`0x1`) | `ETH` | `https://etherscan.io` |
| **Arbitrum One** | `https://arb1.arbitrum.io/rpc` | `42161` (`0xa4b1`) | `ETH` | `https://arbiscan.io` |
| **Base Mainnet** | `https://mainnet.base.org` | `8453` (`0x2105`) | `ETH` | `https://basescan.org` |
| **OP Mainnet** | `https://mainnet.optimism.io` | `10` (`0xa`) | `ETH` | `https://optimistic.etherscan.io` |
| **Polygon PoS** | `https://polygon-rpc.com` | `137` (`0x89`) | `POL` | `https://polygonscan.com` |
| **BNB Smart Chain** | `https://bsc-dataseed.binance.org` | `56` (`0x38`) | `BNB` | `https://bscscan.com` |
| **Avalanche C-Chain** | `https://api.avax.network/ext/bc/C/rpc` | `43114` (`0xa86a`) | `AVAX` | `https://snowtrace.io` |
| **Ethereum Sepolia** | `https://rpc.sepolia.org` | `11155111` (`0xaa36a7`) | `ETH` | `https://sepolia.etherscan.io` |
| **Ethereum Holesky** | `https://ethereum-holesky-rpc.publicnode.com` | `17000` (`0x4268`) | `ETH` | `https://holesky.etherscan.io` |

---

## 3. Step-by-Step Instructions by Wallet

### 🦊 MetaMask (Browser Extension & Mobile)
1. Open MetaMask and switch to the target network (e.g. **Ethereum Mainnet**, **Arbitrum One**, or **Base**).
2. Scroll to the bottom of the **Tokens / Assets** list and click **"Import tokens"** (or **"+ Import Tokens"**).
3. Select the **"Custom token"** tab.
4. In the **Token contract address** field, paste the contract address from the table above.
5. MetaMask will auto-detect the **Token symbol** (e.g. `USDC`) and **Token decimal** (e.g. `6` or `18`). If not auto-filled, enter the exact values from the table.
6. Click **"Next"** (or **"Add Custom Token"**), then click **"Import Tokens"**.
7. The token and your balance will now appear in your wallet balance list.

---

### 🐰 Rabby Wallet
1. Open Rabby and select your active account.
2. Rabby automatically scans all popular tokens across 50+ chains.
3. For newly minted or unlisted custom contracts:
   - Click the **"Tokens"** tab.
   - Click the **"+" (Add Custom Token)** button in the top-right.
   - Select the target chain (e.g., Base or Arbitrum).
   - Paste the Contract Address.
   - Toggle the token to **Enabled / Visible**.

---

### 🔵 Coinbase Wallet (Extension & Mobile App)
1. Open Coinbase Wallet and go to the **Assets** tab.
2. Select the network where the token resides.
3. Tap or click **"Manage Assets"** or **"Add Custom Token"**.
4. Paste the Token Contract Address.
5. Review the detected symbol and decimals, then confirm by selecting **"Add"**.

---

### 🛡️ Trust Wallet
1. Open Trust Wallet and tap the **Filter / Manage Tokens** icon in the top-right corner.
2. Tap the **"+" (Add Custom Token)** button.
3. Select the correct **Network** (e.g. Ethereum, BNB Smart Chain, Polygon).
4. Paste the Contract Address into the **Contract Address** field.
5. The Name, Symbol, and Decimals will load automatically.
6. Tap **"Save"** or **"Done"**.

---

### 👻 Phantom (EVM Mode)
1. Ensure your Phantom wallet has Ethereum / Polygon / Base enabled in **Settings > Active Networks**.
2. Click on the **Tokens list**, scroll to the bottom, and select **"Manage Token List"**.
3. Click **"+" (Custom Token)**.
4. Select the network, paste the contract address, and click **"Add Token"**.

---

## 4. Programmatic 1-Click Import (EIP-747 `wallet_watchAsset`)

Web3 dApps can prompt the user's browser wallet to automatically import any token using standard EIP-747:

```javascript
async function importTokenToWallet(token) {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const wasAdded = await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: token.address,
            symbol: token.symbol,
            decimals: token.decimals,
            image: token.logoUrl || undefined,
          },
        },
      });
      if (wasAdded) {
        console.log("Token successfully registered in wallet!");
      }
    } catch (error) {
      console.error("Failed to add token to wallet:", error);
    }
  }
}
```
