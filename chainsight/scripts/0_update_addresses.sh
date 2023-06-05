# !bin/sh
cd `dirname $0`
cd ..
TARGET_SCRIPT=scripts/1_deploy_canisters.sh

SRC_LEND_POOL_BEFORE=$(cat ${TARGET_SCRIPT}|grep SRC_LEND_POOL|cut -d "=" -f2)
DST_LEND_POOL_BEFORE=$(cat ${TARGET_SCRIPT}|grep DST_LEND_POOL|cut -d "=" -f2)
SRC_ADAPTER_BEFORE=$(cat ${TARGET_SCRIPT}|grep SRC_ADAPTER|cut -d "=" -f2)
DST_ADAPTER_BEFORE=$(cat ${TARGET_SCRIPT}|grep DST_ADAPTER|cut -d "=" -f2)
SRC_ORACLE_BEFORE=$(cat ${TARGET_SCRIPT}|grep SRC_ORACLE|cut -d "=" -f2)
DST_ORACLE_BEFORE=$(cat ${TARGET_SCRIPT}|grep DST_ORACLE|cut -d "=" -f2)

SRC_LEND_POOL_AFTER=$(cat ../contracts/deployments/optimismTest.json|jq .LendingPool)
DST_LEND_POOL_AFTER=$(cat ../contracts/deployments/arbitrumGoerli.json|jq .LendingPool)
SRC_ADAPTER_AFTER=$(cat ../contracts/deployments/optimismTest.json|jq .ChainsightAdapter)
DST_ADAPTER_AFTER=$(cat ../contracts/deployments/arbitrumGoerli.json|jq .ChainsightAdapter)
SRC_ORACLE_AFTER=$(cat ../contracts/deployments/optimismTest.json|jq .Oracle)
DST_ORACLE_AFTER=$(cat ../contracts/deployments/arbitrumGoerli.json|jq .Oracle)

# update address
sed -i  "" "s/$SRC_LEND_POOL_BEFORE/$SRC_LEND_POOL_AFTER/g" ${TARGET_SCRIPT}
sed -i  ""  "s/$DST_LEND_POOL_BEFORE/$DST_LEND_POOL_AFTER/g" ${TARGET_SCRIPT}
sed -i  ""  "s/$SRC_ADAPTER_BEFORE/$SRC_ADAPTER_AFTER/g" ${TARGET_SCRIPT}
sed -i  ""  "s/$DST_ADAPTER_BEFORE/$DST_ADAPTER_AFTER/g" ${TARGET_SCRIPT}
sed -i  ""  "s/$SRC_ORACLE_BEFORE/$SRC_ORACLE_AFTER/g" ${TARGET_SCRIPT}
sed -i  ""  "s/$DST_ORACLE_BEFORE/$DST_ORACLE_AFTER/g" ${TARGET_SCRIPT}

