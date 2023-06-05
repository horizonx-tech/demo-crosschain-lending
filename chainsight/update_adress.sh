# !bin/sh


SRC_LEND_POOL_BEFORE=$(cat test.sh|grep SRC_LEND_POOL|cut -d "=" -f2)
DST_LEND_POOL_BEFORE=$(cat test.sh|grep DST_LEND_POOL|cut -d "=" -f2)
SRC_ADAPTER_BEFORE=$(cat test.sh|grep SRC_ADAPTER|cut -d "=" -f2)
DST_ADAPTER_BEFORE=$(cat test.sh|grep DST_ADAPTER|cut -d "=" -f2)

SRC_LEND_POOL_AFTER=$(cat ../contracts/deployments/optimismTest.json|jq .LendingPool)
DST_LEND_POOL_AFTER=$(cat ../contracts/deployments/arbitrumGoerli.json|jq .LendingPool)
SRC_ADAPTER_AFTER=$(cat ../contracts/deployments/optimismTest.json|jq .ChainsightAdapter)
DST_ADAPTER_AFTER=$(cat ../contracts/deployments/arbitrumGoerli.json|jq .ChainsightAdapter)

# update address
sed -i  "" "s/$SRC_LEND_POOL_BEFORE/$SRC_LEND_POOL_AFTER/g" test.sh
sed -i  ""  "s/$DST_LEND_POOL_BEFORE/$DST_LEND_POOL_AFTER/g" test.sh
sed -i  ""  "s/$SRC_ADAPTER_BEFORE/$SRC_ADAPTER_AFTER/g" test.sh
sed -i  ""  "s/$DST_ADAPTER_BEFORE/$DST_ADAPTER_AFTER/g" test.sh
