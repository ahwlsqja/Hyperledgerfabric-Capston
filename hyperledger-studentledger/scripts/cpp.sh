#!/bin/bash

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s/\${MSPORG}/$6/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        connection-profile/ccp-template.json
}

function json_local_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s/\${MSPORG}/$6/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        connection-profile/ccp-template-local.json
}

function yaml_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s/\${MSPORG}/$6/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        connection-profile/ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

function yaml_local_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s/\${MSPORG}/$6/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        connection-profile/ccp-template-local.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

ORG=student
P0PORT=7051
CAPORT=7054
MSPORG=Student
PEERPEM=organizations/peerOrganizations/student.example.com/tlsca/tlsca.student.example.com-cert.pem
CAPEM=organizations/peerOrganizations/student.example.com/ca/ca.student.example.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM $MSPORG)" > connection-profile/connection-student.json
echo "$(json_local_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM $MSPORG)" > connection-profile/connection-student-local.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM $MSPORG)" > connection-profile/connection-student.yaml
echo "$(yaml_local_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM $MSPORG)" > connection-profile/connection-student-local.yaml

ORG=student-council
P0PORT=7051
CAPORT=8054
MSPORG=Student-council
PEERPEM=organizations/peerOrganizations/student-council.example.com/tlsca/tlsca.student-council.example.com-cert.pem
CAPEM=organizations/peerOrganizations/student-council.example.com/ca/ca.student-council.example.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM $MSPORG)" > connection-profile/connection-student-council.json
echo "$(json_local_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM $MSPORG)" > connection-profile/connection-student-council-local.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM $MSPORG)" > connection-profile/connection-student-council.yaml
echo "$(yaml_local_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM $MSPORG)" > connection-profile/connection-student-council-local.yaml
