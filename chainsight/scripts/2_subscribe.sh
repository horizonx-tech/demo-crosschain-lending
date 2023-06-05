# !bin/sh
cd `dirname $0`
cd ..
# subscribe
echo "subscribing..."
dfx canister call lock_relayer_optimism subscribe $(dfx canister id lock_indexer_optimism )  
dfx canister call lock_relayer_arbitrumGoerli subscribe $(dfx canister id lock_indexer_arbitrumGoerli ) 
dfx canister call unlock_relayer_optimism subscribe $(dfx canister id unlock_indexer_optimism ) 
dfx canister call unlock_relayer_arbitrumGoerli subscribe $(dfx canister id unlock_indexer_arbitrumGoerli ) 
