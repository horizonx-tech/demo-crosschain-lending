# !bin/sh
cd `dirname $0`
cd ..
echo "minting and locking..."
cd .. && npx hardhat run scripts/2_mint_and_lock_on_src.ts --network optimismTest
echo "unlocking..."
cd chainsight && dfx canister call lock_indexer_optimism save_logs  
echo "borrowing..."
cd .. && npx hardhat run scripts/3_borrow_on_dst.ts --network arbitrumGoerli
echo "oracle price gets high..."
npx hardhat run scripts/4_oracle_price_gets_high.ts --network arbitrumGoerli
echo "liquidation..."
npx hardhat run scripts/5_liquidation_on_dst.ts --network arbitrumGoerli
echo "saving logs..."
cd chainsight && dfx canister call unlock_indexer_arbitrumGoerli save_logs   
